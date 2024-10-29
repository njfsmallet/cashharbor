#!/usr/bin/env python3

import os
import sqlite3
import requests
from requests.exceptions import RequestException
from urllib.parse import urlencode
from datetime import date
import argparse
import sys
import logging
import base64

class BIAPIClient:
    def __init__(self):
        self.domain = os.environ.get('BI_DOMAIN')
        self.client_id = os.environ.get('BI_CLIENT_ID')
        self.client_secret = os.environ.get('BI_CLIENT_SECRET')
        self.user_id = os.environ.get('BI_USER_ID')
        self.redirect_uri = os.environ.get('BI_REDIRECT_URI')
        self.api_url = f"https://{self.domain}.biapi.pro/2.0"
        self.db = DatabaseManager('users.db')
        self.users_secret = os.environ.get('BI_USERS_SECRET')
        self.logger = logging.getLogger(__name__)

    def _make_request(self, method, url, **kwargs):
        try:
            response = requests.request(method, url, **kwargs)
            response.raise_for_status()
            return response.json()
        except RequestException as e:
            self.logger.error(f"Error making API request: {e}")
            if hasattr(e.response, 'text'):
                self.logger.error(f"Response: {e.response.text}")
            return None

    def create_bi_user(self):
        url = f"{self.api_url}/auth/init"
        payload = {
            "client_id": self.client_id,
            "client_secret": self.client_secret
        }
        bi_data = self._make_request('POST', url, json=payload)
        
        if bi_data:
            self.db.insert_user(self.user_id, bi_data['id_user'], bi_data['auth_token'])
            
            self.logger.info(f"New user initialized with BI ID: {bi_data['id_user']}")
            self.logger.info(f"Auth Token: {bi_data['auth_token']}")
            
            return bi_data['id_user'], bi_data['auth_token']
        return None, None

    def get_bi_user_info(self):
        return self.db.get_user_info(self.user_id)

    def get_temporary_code(self, bi_token):
        url = f"{self.api_url}/auth/token/code"
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('GET', url, headers=headers)
        return response["code"] if response else None

    def get_webview_url(self, temporary_code):
        webview_url = f"{self.api_url}/auth/webview/connect"
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "code": temporary_code
        }
        return f"{webview_url}?{urlencode(params)}"

    def get_user_connections(self, bi_token):
        url = f"{self.api_url}/users/me/connections"
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('GET', url, headers=headers)
        return response.get('connections', []) if response else []

    def get_connector_info(self, connector_id):
        url = f"{self.api_url}/connectors/{connector_id}"
        return self._make_request('GET', url)

    def get_recent_transactions(self, bi_token):
        today = date.today()
        start_date = date(today.year, today.month, 1)
        end_date = today

        url = f"{self.api_url}/users/me/transactions"
        params = {
            "limit": 1000,
            "min_date": start_date.strftime("%Y-%m-%d"),
            "max_date": end_date.strftime("%Y-%m-%d")
        }
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('GET', url, headers=headers, params=params)
        if response:
            return response.get('transactions', [])
        return None

    def get_user_accounts(self, bi_token):
        url = f"{self.api_url}/users/me/accounts"
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('GET', url, headers=headers)
        return response.get('accounts', []) if response else []

    def check_connection_state(self, bi_token, connection_id):
        url = f"{self.api_url}/users/me/connections/{connection_id}"
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('GET', url, headers=headers)
        return response.get('state') if response else None

    def resume_connection(self, bi_token, connection_id):
        url = f"{self.api_url}/connections/{connection_id}"
        headers = {'Authorization': f'Bearer {bi_token}'}
        data = {"resume": True}
        response = self._make_request('POST', url, headers=headers, json=data)
        if response:
            print("The connection has been successfully resumed.")
        else:
            print("Error resuming the connection.")

    def delete_connection(self, bi_token, connection_id):
        url = f"{self.api_url}/users/me/connections/{connection_id}"
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('DELETE', url, headers=headers)
        if response is not None:
            print(f"Connection {connection_id} successfully deleted.")
        else:
            print(f"Error deleting connection {connection_id}.")

    def delete_user(self, bi_token):
        url = f"{self.api_url}/users/me"
        headers = {'Authorization': f'Bearer {bi_token}'}
        response = self._make_request('DELETE', url, headers=headers)
        if response is not None:
            print("User successfully deleted.")
            return True
        else:
            print("Error deleting user.")
            return False

    def list_users(self):
        url = f"{self.api_url}/users"
        headers = {'Authorization': f'Bearer {self.users_secret}'}
        response = self._make_request('GET', url, headers=headers)
        return response.get('users', []) if response else []

class DatabaseManager:
    def __init__(self, db_name):
        self.db_name = db_name
        self.logger = logging.getLogger(__name__)

    def get_connection(self):
        conn = sqlite3.connect(self.db_name)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        conn = self.get_connection()
        conn.execute('''CREATE TABLE IF NOT EXISTS users
                        (id INTEGER PRIMARY KEY,
                         bi_id TEXT UNIQUE,
                         bi_token TEXT)''')
        conn.commit()
        conn.close()

    def get_user_info(self, user_id):
        try:
            conn = self.get_connection()
            user = conn.execute('SELECT bi_id, bi_token FROM users WHERE id = ?', (user_id,)).fetchone()
            conn.close()
            if user:
                return user['bi_id'], user['bi_token']  # Return the token directly without decryption
            return None, None
        except sqlite3.OperationalError as e:
            if "no such table" in str(e):
                print("Database not initialized. Please run the script with --create-user to create a new user.")
                exit(1)
            else:
                raise

    def insert_user(self, user_id, bi_id, bi_token):
        conn = self.get_connection()
        try:
            conn.execute('INSERT INTO users (id, bi_id, bi_token) VALUES (?, ?, ?)',
                         (user_id, bi_id, bi_token))  # Store the token directly without encryption
            conn.commit()
        except sqlite3.IntegrityError:
            self.logger.error(f"Error: A user with ID {user_id} already exists in the database.")
            self.logger.error("If you're seeing this message, there might be an inconsistency in the database.")
            self.logger.error("Please check your database or contact support.")
            sys.exit(1)
        finally:
            conn.close()

    def delete_user(self, bi_id):
        conn = self.get_connection()
        conn.execute('DELETE FROM users WHERE bi_id = ?', (bi_id,))
        conn.commit()
        conn.close()

class BIManager:
    def __init__(self):
        self.api_client = BIAPIClient()
        self.bi_id = None
        self.bi_token = None
        self.logger = logging.getLogger(__name__)

    def initialize(self):
        self.api_client.db.init_db()
        existing_user = self.api_client.db.get_user_info(self.api_client.user_id)
        if existing_user[0]:
            raise ValueError(f"A user with ID {self.api_client.user_id} already exists in the database.")
        else:
            self.bi_id, self.bi_token = self.api_client.create_bi_user()

    def load_user(self):
        self.bi_id, self.bi_token = self.api_client.get_bi_user_info()
        if not self.bi_id or not self.bi_token:
            raise ValueError(f"No user found with ID {self.api_client.user_id}. Please create a new user first.")

    def add_connection(self):
        temporary_code = self.api_client.get_temporary_code(self.bi_token)
        return self.api_client.get_webview_url(temporary_code)

    def delete_connection(self, connection_id):
        self.api_client.delete_connection(self.bi_token, connection_id)

    def delete_user(self):
        if self.api_client.delete_user(self.bi_token):
            self.api_client.db.delete_user(self.bi_id)
            return True
        return False

    def list_users(self):
        return self.api_client.list_users()

    def check_and_handle_connection_state(self, connection_id):
        state = self.api_client.check_connection_state(self.bi_token, connection_id)
        if state in ['SCARequired', 'webauthRequired']:
            return self.handle_sca_required(connection_id)
        return state

    def handle_sca_required(self, connection_id):
        # Obtenir un code temporaire
        temporary_code = self.api_client.get_temporary_code(self.bi_token)
        
        # Construire l'URL de reconnexion
        webview_url = f"https://{self.api_client.domain}.biapi.pro/2.0/auth/webview/reconnect"
        params = {
            "client_id": self.api_client.client_id,
            "code": temporary_code,
            "connection_id": connection_id,
            "redirect_uri": self.api_client.redirect_uri
        }
        
        # Construire l'URL complète avec les paramètres
        full_url = f"{webview_url}?{urlencode(params)}"
        
        return {
            'status': 'SCA_required',
            'webview_url': full_url
        }

    def get_accounts(self):
        connections = self.api_client.get_user_connections(self.bi_token)
        self.logger.info(f"User connections: {connections}")
        for connection in connections:
            connection_state = self.check_and_handle_connection_state(connection['id'])
            if isinstance(connection_state, dict) and connection_state['status'] == 'SCA_required':
                return connection_state  # Retourner immédiatement si une SCA est requise

        accounts = self.api_client.get_user_accounts(self.bi_token)
        return {
            'accounts': accounts
        }

    def get_transactions(self):
        transactions = self.api_client.get_recent_transactions(self.bi_token)
        return {
            'transactions': transactions
        }

def create_user():
    manager = BIManager()
    manager.initialize()
    return {"message": "User created successfully", "bi_id": manager.bi_id}

def add_connection():
    manager = BIManager()
    manager.load_user()
    temporary_code = manager.api_client.get_temporary_code(manager.bi_token)
    webview_url = manager.api_client.get_webview_url(temporary_code)
    return {"webview_url": webview_url}

def list_connections():
    manager = BIManager()
    manager.load_user()
    connections = manager.api_client.get_user_connections(manager.bi_token)
    return {"connections": connections}

def delete_connection(connection_id: int):
    manager = BIManager()
    manager.load_user()
    manager.api_client.delete_connection(manager.bi_token, connection_id)
    return {"message": f"Connection {connection_id} deleted successfully"}

def delete_user():
    manager = BIManager()
    manager.load_user()
    if manager.api_client.delete_user(manager.bi_token):
        manager.api_client.db.delete_user(manager.bi_id)
        return {"message": "User deleted successfully"}
    else:
        return {"message": "Failed to delete user"}

def list_users():
    manager = BIManager()
    users = manager.api_client.list_users()
    return {"users": users}

def get_accounts():
    manager = BIManager()
    manager.load_user()
    return manager.get_accounts()

def get_transactions():
    manager = BIManager()
    manager.load_user()
    return manager.get_transactions()
