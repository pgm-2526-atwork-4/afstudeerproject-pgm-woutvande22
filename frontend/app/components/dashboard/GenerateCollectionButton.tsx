import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const GenerateCollectionButton = () => (
  <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none pl-56">
    <button
      type="button"
      className="flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-full shadow-lg transition-colors cursor-pointer pointer-events-auto"
    >
      <AutoAwesomeIcon />
      Generate Collection
    </button>
  </div>
);