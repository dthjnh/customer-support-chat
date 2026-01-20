import { useEffect, useState } from "react";

function App() {
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.message));
  }, []);

  return (
    <div>
      <h1>Customer Support Chat</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
