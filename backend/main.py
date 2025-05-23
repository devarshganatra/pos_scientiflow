from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import csv
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    contents = await file.read()

    if filename.endswith(".csv"):
        try:
            text = contents.decode("utf-8")
            reader = csv.reader(text.splitlines())
            rows = list(reader)
            if not rows:
                raise HTTPException(status_code=400, detail="Empty CSV")
            columns = rows[0]
            data = [dict(zip(columns, row)) for row in rows[1:] if len(row) == len(columns)]
            return {"columns": columns, "data": data}
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")

    elif filename.endswith(".json"):
        try:
            parsed = json.loads(contents)
            if isinstance(parsed, list) and parsed:
                columns = list(parsed[0].keys())
                return {"columns": columns, "data": parsed}
            elif isinstance(parsed, dict):
                columns = list(parsed.keys())
                return {"columns": columns, "data": [parsed]}
            else:
                raise HTTPException(status_code=400, detail="Invalid JSON structure")
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid JSON format")

    else:
        raise HTTPException(status_code=400, detail="File must be CSV or JSON")
