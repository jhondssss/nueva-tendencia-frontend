import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from '@/router/index'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <RouterProvider router={router} />
        <Toaster
            position="top-right"
            toastOptions={{
                style: {
                    background: '#1C1C1C',
                    color: '#F5F0E8',
                    border: '1px solid #3A3A3A',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                },
                success: { iconTheme: { primary: '#C9923A', secondary: '#0D0D0D' } },
                error:   { iconTheme: { primary: '#ef4444', secondary: '#0D0D0D' } },
                duration: 3000,
            }}
        />
    </React.StrictMode>,
)
