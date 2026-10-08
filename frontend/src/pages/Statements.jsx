import { FileText, Download } from "lucide-react";

function Statements({ downloadStatement, loading }) {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText size={32} />
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-slate-900">
            Monthly Statement
          </h1>

          <p className="mt-2 max-w-lg text-sm text-slate-500">
            Download your monthly credit card payment statement as a PDF.
          </p>

          <button
            type="button"
            onClick={downloadStatement}
            disabled={loading}
            className="mt-7 flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={18} />

            {loading
              ? "Generating Statement..."
              : "Download Monthly Statement"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Statements;