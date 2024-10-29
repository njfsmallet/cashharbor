import loggin

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from bi_manager import BIManager, create_user, add_connection, list_connections, delete_connection, delete_user, DatabaseManager, get_accounts, get_transactions

app = FastAPI()

# Middleware pour sécuriser les hôtes de confiance
app.add_middleware(
    TrustedHostMiddleware, allowed_hosts=["nma.example.com", "localhost", "127.0.0.1"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://nma.example.com", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the database
db_manager = DatabaseManager('users.db')
db_manager.init_db()

# Initialize the BIManager
bi_manager = BIManager()

@app.get("/api/")
def read_root():
    return {"Hello": "World"}

@app.post("/api/create-user")
def api_create_user():
    try:
        result = create_user()
        return result
    except Exception as e:
        logging.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/add-connection")
def api_add_connection():
    try:
        result = add_connection()
        return result
    except ValueError as ve:
        logging.error(f"Error adding connection: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error adding connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/list-connections")
def api_list_connections():
    try:
        result = list_connections()
        return result
    except ValueError as ve:
        logging.error(f"Error listing connections: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error listing connections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get-accounts")
def api_get_accounts():
    try:
        result = get_accounts()
        if isinstance(result, dict) and result.get('status') == 'SCA_required':
            return {"status": "SCA_required", "webview_url": result['webview_url']}
        return result
    except ValueError as ve:
        logging.error(f"Error getting accounts: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error getting accounts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/get-transactions")
def api_get_transactions():
    try:
        result = get_transactions()
        return result
    except ValueError as ve:
        logging.error(f"Error getting transactions: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error getting transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/delete-connection")
def api_delete_connection(connection_id: int = Query(..., description="ID of the connection to delete")):
    try:
        result = delete_connection(connection_id)
        return result
    except ValueError as ve:
        logging.error(f"Error deleting connection: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error deleting connection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/delete-user")
def api_delete_user():
    try:
        result = delete_user()
        return result
    except ValueError as ve:
        logging.error(f"Error deleting user: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logging.error(f"Error deleting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
