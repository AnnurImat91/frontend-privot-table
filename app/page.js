"use client";
import { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [sheets, setSheets] = useState([]);
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedSheet, setSelectedSheet] = useState("");
  const [data, setData] = useState([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const API = "http://localhost:5000";

  // 📌 Ambil daftar file
  const fetchFiles = () => {
    fetch(`${API}/api/files`)
      .then((res) => res.json())
      .then((d) => setFiles(d))
      .catch((err) => console.error("Gagal fetch files:", err));
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // 📌 Upload file Excel
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(`${API}/api/upload`, {
        method: "POST",
        body: formData,
      });
      await res.json();
      fetchFiles();
    } catch (err) {
      console.error("Upload gagal:", err);
    } finally {
      setUploading(false);
    }
  };

  // 📌 Ambil daftar sheet
  useEffect(() => {
    if (!selectedFile) return;

    fetch(`${API}/api/sheets/${selectedFile}`)
      .then((res) => res.json())
      .then((d) => setSheets(d))
      .catch((err) => console.error("Gagal fetch sheets:", err));
  }, [selectedFile]);

  // 📌 Ambil data dari sheet
  useEffect(() => {
    if (!selectedFile || !selectedSheet) return;

    fetch(`${API}/api/data/${selectedFile}/${selectedSheet}`)
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((err) => console.error("Gagal fetch data:", err));
  }, [selectedFile, selectedSheet]);

  // 📥 Download data
  const handleDownload = () => {
    if (data.length === 0) return;

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedSheet || "Sheet1");

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(
      new Blob([wbout], { type: "application/octet-stream" }),
      `${selectedSheet || "data"}.xlsx`
    );
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">
        📊 Data Hujan per Wilayah
      </h1>

      {/* Upload File */}
      <div className="mb-6 flex items-center gap-4">
        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow flex items-center gap-2"
        >
          📤 Pilih File
        </button>
        {uploading && <p className="text-blue-500">⏳ Uploading...</p>}
      </div>

      {/* Pilih File */}
      <div className="mb-4">
        <label className="mr-2 font-semibold text-white">Pilih File:</label>
        <select
          value={selectedFile}
          onChange={(e) => {
            setSelectedFile(e.target.value);
            setSelectedSheet("");
            setData([]);
          }}
          className="border px-3 py-2 rounded-md shadow-sm bg-white text-black focus:ring focus:ring-blue-300"
        >
          <option value="">-- pilih file --</option>
          {files.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Pilih Sheet */}
      {sheets.length > 0 && (
        <div className="mb-6">
          <label className="mr-2 font-semibold text-white">Pilih Sheet:</label>
          <select
            value={selectedSheet}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedSheet(val);
              setData(val ? [] : []); // reset data kalau pilih kosong
            }}
            className="border px-3 py-2 rounded-md shadow-sm bg-white text-black focus:ring focus:ring-blue-300"
          >
            <option value="">-- pilih sheet --</option>
            {sheets.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tombol Download */}
      {data.length > 0 && (
        <button
          onClick={handleDownload}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md mb-6 shadow flex items-center gap-2"
        >
          ⬇️ Download Data
        </button>
      )}

      {/* Tabel Data */}
      {data.length > 0 &&
        (() => {
          // 🔎 Filter hanya kolom yang ada isi (bukan null/undefined/kosong semua)
          const availableColumns = Object.keys(data[0]).filter((col) =>
            data.some(
              (row) =>
                row[col] !== undefined &&
                row[col] !== null &&
                String(row[col]).trim() !== ""
            )
          );

          return (
            <div className="overflow-x-auto shadow-lg rounded-lg">
              <table className="w-full border border-gray-300 text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-900">
                  <tr>
                    <th className="border px-3 py-2">No</th>
                    {availableColumns.map((col) => (
                      <th key={col} className="border px-3 py-2">
                        {col === "no_das"
                          ? "No DAS"
                          : col === "nama_das"
                          ? "Wilayah"
                          : col === "luas_das"
                          ? "Luas DAS"
                          : col.replace("hari", "Hari ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="border px-3 py-2 text-center">
                        {idx + 1}
                      </td>
                      {availableColumns.map((col) => (
                        <td key={col} className="border px-3 py-2 text-center">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
    </div>
  );
}
