import { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [patients, setPatients] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState({
    total_patients: 0,
    high_patients: 0,
    normal_patients: 0,
    average_liver_enzyme: 0,
  });

  const askQuestion = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(data.answer || data.detail || "Backend error");
        return;
      }

      setAnswer(data.answer || "No answer returned");
    } catch (error) {
      console.error(error);
      setAnswer("Error connecting to backend");
    }
  };

  const loadPatients = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/patients");
      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error(error);
      setAnswer("Could not load patients");
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/summary");
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error(error);
    }
  };

  const uploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Upload failed");
        return;
      }

      alert(data.message || "Upload successful");
      loadPatients();
      loadSummary();
      setFilter("All");
      setSearch("");
    } catch (error) {
      console.error(error);
      alert("Upload failed");
    }
  };

  useEffect(() => {
    loadPatients();
    loadSummary();
  }, []);

  const filteredPatients = patients
    .filter((p) => (filter === "All" ? true : p.status === filter))
    .filter((p) =>
      String(p.patient_id).toLowerCase().includes(search.toLowerCase())
    );

  const chartData = {
    labels: filteredPatients.map((p) => p.patient_id),
    datasets: [
      {
        label: "Liver Enzyme Levels",
        data: filteredPatients.map((p) => p.liver_enzyme),
      },
    ],
  };

  const cardStyle = {
    flex: 1,
    minWidth: "180px",
    padding: "20px",
    borderRadius: "12px",
    backgroundColor: "#f5f7fb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    textAlign: "center",
  };

  const filterButtonStyle = (name, color) => ({
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    color: "white",
    backgroundColor: filter === name ? color : "#9ca3af",
    marginRight: "10px",
  });

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "50px auto",
        padding: "30px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "32px", textAlign: "center" }}>Yalab AI 🧠</h1>
      <p style={{ color: "#555", textAlign: "center" }}>
        Clinical Data Intelligence Platform
      </p>

      <div
        style={{
          display: "flex",
          gap: "15px",
          marginTop: "30px",
          flexWrap: "wrap",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Patients</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
            {summary.total_patients}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>High Patients</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "red" }}>
            {summary.high_patients}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Normal Patients</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "green" }}>
            {summary.normal_patients}
          </p>
        </div>

        <div style={cardStyle}>
          <h3>Average Liver Enzyme</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold" }}>
            {summary.average_liver_enzyme}
          </p>
        </div>
      </div>

      <div style={{ marginTop: "25px", marginBottom: "20px", textAlign: "center" }}>
        <input type="file" accept=".csv,.sas7bdat" onChange={uploadFile} />
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <input
          type="text"
          placeholder="Ask about patient data..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          style={{
            width: "60%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
          }}
        />
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={askQuestion}
          style={{
            marginRight: "12px",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#4CAF50",
            color: "white",
            cursor: "pointer",
          }}
        >
          Ask
        </button>

        <button
          onClick={loadPatients}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#2196F3",
            color: "white",
            cursor: "pointer",
          }}
        >
          Show Patients
        </button>
      </div>

      <div
        style={{
          marginTop: "30px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <h2>Answer</h2>
        <p style={{ fontSize: "18px", color: "#333" }}>{answer}</p>
      </div>

      <div style={{ marginTop: "30px", textAlign: "center" }}>
        <h2>Filters</h2>

        <button
          onClick={() => setFilter("All")}
          style={filterButtonStyle("All", "#2563eb")}
        >
          All
        </button>

        <button
          onClick={() => setFilter("High")}
          style={filterButtonStyle("High", "#dc2626")}
        >
          High
        </button>

        <button
          onClick={() => setFilter("Normal")}
          style={filterButtonStyle("Normal", "#16a34a")}
        >
          Normal
        </button>

        <div style={{ marginTop: "15px" }}>
          <input
            type="text"
            placeholder="Search Patient ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "250px",
            }}
          />
        </div>
      </div>

      {filteredPatients.length > 0 && (
        <>
          <div style={{ marginTop: "40px" }}>
            <h2>Liver Enzyme Chart ({filter})</h2>
            <Bar data={chartData} />
          </div>

          <div style={{ marginTop: "40px" }}>
            <h2>Patient Data ({filter})</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
                backgroundColor: "white",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9" }}>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Patient ID
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Liver Enzyme
                  </th>
                  <th style={{ padding: "12px", border: "1px solid #ddd" }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p, i) => (
                  <tr key={i}>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {p.patient_id}
                    </td>
                    <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                      {p.liver_enzyme}
                    </td>
                    <td
                      style={{
                        padding: "12px",
                        border: "1px solid #ddd",
                        color: p.status === "High" ? "red" : "green",
                        fontWeight: "bold",
                      }}
                    >
                      {p.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;