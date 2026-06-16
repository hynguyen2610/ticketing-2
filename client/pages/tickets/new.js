import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import buildClient from '../../api/build-client';

const NewTicket = () => {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatusMessage('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('price', price);

    files.forEach((file) => {
      formData.append('images', file);
    });

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.errors?.[0]?.message || data?.message || 'Error uploading ticket.');
      }

      setStatusMessage(data.message || 'Ticket created successfully.');
      setTitle('');
      setPrice('');
      setFiles([]);
    } catch (error) {
      setStatusMessage(error.message || 'Error uploading ticket.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const onBlur = () => {
    const value = parseFloat(price);
    if (!isNaN(value)) {
      setPrice(value.toFixed(2));
    }
  };

  return (
    <section className="page-panel p-6">
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">Sell</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Create a Ticket</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Add the ticket details and upload clear images so buyers can inspect the listing.
        </p>
      </div>

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="mt-8 max-w-3xl space-y-6">
        <div>
          <label className="text-sm font-medium text-ink" htmlFor="ticket-title">
            Title
          </label>
          <input
            id="ticket-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink" htmlFor="ticket-price">
            Price
          </label>
          <input
            id="ticket-price"
            type="text"
            inputMode="decimal"
            value={price}
            onBlur={onBlur}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-blue-100"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">Images</label>
          <div
            {...getRootProps({
              className:
                'mt-2 flex min-h-40 cursor-pointer items-center justify-center rounded-md border border-dashed border-line bg-slate-50 px-6 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50',
            })}
          >
            <input {...getInputProps()} />
            <div>
              <p className="text-sm font-medium text-ink">Drop images here or click to browse</p>
              <p className="mt-2 text-xs text-muted">Upload one or more images for this ticket.</p>
            </div>
          </div>

          {files.length > 0 && (
            <aside className="mt-4 rounded-md border border-line bg-white p-4">
              <h2 className="text-sm font-medium text-ink">Selected files</h2>
              <ul className="mt-3 divide-y divide-line text-sm text-muted">
                {files.map((file) => (
                  <li className="flex items-center justify-between gap-4 py-2" key={file.path}>
                    <span className="truncate">{file.path}</span>
                    <span className="shrink-0 text-xs">{Math.round(file.size / 1024)} KB</span>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>

        {statusMessage && (
          <p className="rounded-md border border-line bg-slate-50 px-4 py-3 text-sm text-muted">
            {statusMessage}
          </p>
        )}

        <button className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create ticket'}
        </button>
      </form>
    </section>
  );
};

export async function getServerSideProps(context) {
  const client = buildClient(context);
  
  try {
    // Check if the user is authenticated
    const { data } = await client.get('/api/users/currentuser');

    // If the user is not authenticated, redirect to login
    if (!data.currentUser) {
      return {
        redirect: {
          destination: '/auth/signin',
          permanent: false,
        },
      };
    }

    // If authenticated, return current user data
    return {
      props: {
        currentUser: data.currentUser,
      },
    };
  } catch (error) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
}

export default NewTicket;
