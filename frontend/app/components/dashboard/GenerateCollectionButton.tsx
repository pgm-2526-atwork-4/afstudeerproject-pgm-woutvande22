import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

export const GenerateCollectionButton = () => (
  <div className="fixed bottom-8 left-1/2 -translate-x-1/2">
    <button
      type="button"
      className="flex items-center gap-2 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-full shadow-lg transition-colors cursor-pointer"
    >
      <AutoAwesomeIcon />
      Generate Collection
    </button>
  </div>
);