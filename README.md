<p align="center">
  <img src="logo.png" alt="CashHarbor Logo" width="797" height="185">
</p>

#

CashHarbor is an open-source financial aggregator that allows you to securely view and manage your bank accounts. The application uses React for the frontend and FastAPI for the backend, with Powens (Budget Insight) API integration for bank aggregation.

## ✨ Features

- **Secure bank aggregation** via Powens API
- **Account overview** with balances and transactions
- **Cash flow analysis** with graphical visualizations
- **Modern and responsive interface** built with React
- **Self-hostable** for complete data control
- **Secure authentication** with SCA (Strong Customer Authentication) support

## 🛠 Tech Stack

- **Frontend**: React, Framer Motion, Styled Components
- **Backend**: FastAPI, SQLite
- **Proxy**: Nginx
- **Container**: Docker
- **Banking API**: Powens (Budget Insight)

## 🚀 Getting Started

### Prerequisites

- Docker
- Powens (Budget Insight) developer account
- Environment variables configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/njfsmallet/cashharbor.git
cd cashharbor
```

2. Configure environment variables in `backend/.env`:
```env
BI_DOMAIN=your-domain
BI_CLIENT_ID=your-client-id
BI_CLIENT_SECRET=your-client-secret
BI_USER_ID=1
BI_REDIRECT_URI=http://your-domain/connection_established
```

3. Run the application:
```bash
chmod +x run.sh
./run.sh
```

The application will be available at `http://localhost:80`

## 🔒 Security Features

- Nginx basic authentication
- SCA support for bank connections
- Local data storage
- Secure reverse proxy

## 🔧 Project Structure

```
cashharbor/
├── my-app/               # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       └── ...
├── backend/              # FastAPI backend
│   ├── main.py
│   └── bi_manager.py
├── Dockerfile            # Docker configuration
├── nginx.conf            # Nginx configuration
└── run.sh                # Deployment script
└── supervisor.conf       # Supervisor configuration
```

## 📜 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## ⚠️ Disclaimer

This project is provided as-is, without any warranties. Make sure you understand the security implications before deploying the application.

## 🙏 Acknowledgments

- [Powens (Budget Insight)](https://www.powens.com/) for their banking API
- The open-source community for the various libraries used
