from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import pyreadstat

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load default data
df = pd.read_csv("data.csv", dtype={"patient_id": str})

# Request model
class Query(BaseModel):
    question: str

# Root check
@app.get("/")
def root():
    return {"message": "Yalab backend running 🚀"}

# Get all patients
@app.get("/patients")
def get_patients():
    return {"patients": df.to_dict(orient="records")}

# Upload CSV or SAS
@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    global df

    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file.file, dtype={"patient_id": str})
        elif filename.endswith(".sas7bdat"):
            data, meta = pyreadstat.read_sas7bdat(file.file)
            df = data
        else:
            return {"error": "Unsupported file format. Upload CSV or SAS"}

        return {"message": "File uploaded successfully"}
    except Exception as e:
        return {"error": str(e)}
@app.get("/summary")
def get_summary():
    total_patients = len(df)
    high_patients = len(df[df["status"] == "High"])
    normal_patients = len(df[df["status"] == "Normal"])
    average_liver = round(df["liver_enzyme"].mean(), 2)

    return {
        "total_patients": total_patients,
        "high_patients": high_patients,
        "normal_patients": normal_patients,
        "average_liver_enzyme": average_liver,
    }
# Ask logic
@app.post("/ask")
def ask_question(query: Query):
    question = query.question.lower()

    # HIGH
    if "high" in question:
        high_patients = df[df["status"] == "High"]
        patients = high_patients["patient_id"].astype(str).tolist()
        return {"answer": f"High patients: {patients}"}

    # NORMAL
    elif "normal" in question:
        normal_patients = df[df["status"] == "Normal"]
        patients = normal_patients["patient_id"].astype(str).tolist()
        return {"answer": f"Normal patients: {patients}"}

    # HIGHEST
    elif "highest" in question or "max" in question:
        max_row = df.loc[df["liver_enzyme"].idxmax()]
        return {
            "answer": f"Patient {str(max_row['patient_id'])} has highest value: {max_row['liver_enzyme']}"
        }

    # LOWEST
    elif "lowest" in question or "min" in question:
        min_row = df.loc[df["liver_enzyme"].idxmin()]
        return {
            "answer": f"Patient {str(min_row['patient_id'])} has lowest value: {min_row['liver_enzyme']}"
        }

    # AVERAGE
    elif "average" in question or "mean" in question:
        avg = df["liver_enzyme"].mean()
        return {"answer": f"Average liver enzyme: {round(avg, 2)}"}

    # ALL
    elif "all" in question:
        return {"answer": str(df.to_dict(orient="records"))}

    # DEFAULT
    else:
        return {
            "answer": "Try asking: high, normal, highest, lowest, average"
        }