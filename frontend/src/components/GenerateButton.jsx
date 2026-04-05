import { BsLightningChargeFill } from "react-icons/bs";
import { ImSpinner8 } from "react-icons/im";

const GenerateButton = ({ onClick, generating, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={generating || loading}
    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {generating ? (
      <>
        <ImSpinner8 className="h-4 w-4 animate-spin" /> Generating...
      </>
    ) : (
      <>
        <BsLightningChargeFill className="h-4 w-4" /> Generate
      </>
    )}
  </button>
);

export default GenerateButton;
