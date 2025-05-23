## ScientiFlow POS 
# Setup
Backend (Python)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Frontend(React)
```bash
cd frontend
npm install  
npm start
```
# Open http://localhost:3000 in your browser.
CSV: First row should be headers, regular comma-separated format
JSON: Array of objects like [{"name": "John", "age": 30}, {"name": "Jane", "age": 25}]
