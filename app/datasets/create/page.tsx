import CreateDatasetForm from '@/components/datasets/CreateDatasetForm';

export default function CreateDatasetPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Dataset</h1>
        <p className="text-gray-600">
          Add a new dataset to your data portal. Fill in the information below and upload your resources.
        </p>
      </div>

      <CreateDatasetForm />
    </div>
  );
}
