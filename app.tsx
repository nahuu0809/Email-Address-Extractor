import EmailExtractor from "./email-extractor"
import ValidationDetails from "./validation-details"

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-300">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Advanced Email Validator & Comparator</h1>
        <EmailExtractor />
        <ValidationDetails />
      </div>
    </div>
  )
}
