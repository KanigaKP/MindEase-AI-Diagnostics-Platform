import os
import chromadb
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from dotenv import load_dotenv

# Load .env from the backend directory (not CWD)
_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_env_path)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PDF_DIR = os.path.join(DATA_DIR, "pdfs")
os.makedirs(PDF_DIR, exist_ok=True)

CHROMA_HOST = os.getenv("CHROMA_HOST", "localhost")
CHROMA_PORT = int(os.getenv("CHROMA_PORT", "8000"))
COLLECTION_NAME = "mindease_kb"

print("Initializing embeddings model (all-MiniLM-L6-v2)...")
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={'device': 'cpu'}
)

def get_chroma_client():
    """
    Connect to Chroma server if possible. 
    Otherwise, fallback to local persistent client.
    """
    try:
        # Try server client
        client = chromadb.HttpClient(host=CHROMA_HOST, port=CHROMA_PORT)
        # Test connection
        client.heartbeat()
        print(f"Connected to ChromaDB server at http://{CHROMA_HOST}:{CHROMA_PORT}")
        return client, False
    except Exception as e:
        print(f"Failed to connect to ChromaDB server: {e}. Falling back to local DB.")
        persist_dir = os.path.join(DATA_DIR, "chromadb_local")
        os.makedirs(persist_dir, exist_ok=True)
        client = chromadb.PersistentClient(path=persist_dir)
        return client, True

def get_vectorstore():
    client, is_local = get_chroma_client()
    if is_local:
        return Chroma(
            client=client,
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings,
            persist_directory=os.path.join(DATA_DIR, "chromadb_local")
        )
    else:
        return Chroma(
            client=client,
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings
        )

def retrieve_context(query: str, k: int = 3) -> str:
    """
    Retrieve top K matching document chunks from the vector database.
    """
    try:
        db = get_vectorstore()
        # Verify collection exists using the vectorstore's underlying client
        # to avoid creating a second redundant connection
        underlying_client = db._client
        collections = [c.name for c in underlying_client.list_collections()]
        if COLLECTION_NAME not in collections:
            return "No background knowledge base documents have been uploaded yet."
            
        docs = db.similarity_search(query, k=k)
        if not docs:
            return "No relevant background information found."
        
        context_parts = []
        for idx, doc in enumerate(docs):
            source = doc.metadata.get("source", "Unknown PDF")
            filename = os.path.basename(source)
            page = doc.metadata.get("page", 0) + 1
            context_parts.append(f"[{filename} - Page {page}]: {doc.page_content}")
            
        return "\n\n".join(context_parts)
    except Exception as e:
        print(f"RAG retrieval error: {e}")
        return f"Error retrieving context from knowledge base: {e}"

def process_and_embed_pdf(file_path: str) -> dict:
    """
    Loads a PDF file, splits it into semantic chunks, and adds it to ChromaDB.
    """
    try:
        # Load PDF
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        # Split text into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=750,
            chunk_overlap=100
        )
        chunks = text_splitter.split_documents(documents)
        
        # Add metadata source
        for chunk in chunks:
            chunk.metadata["source"] = file_path
            
        # Write to ChromaDB
        db = get_vectorstore()
        db.add_documents(chunks)
        
        return {
            "success": True,
            "chunks_added": len(chunks),
            "pages_processed": len(documents)
        }
    except Exception as e:
        print(f"Failed to embed PDF {file_path}: {e}")
        return {
            "success": False,
            "error": str(e)
        }
