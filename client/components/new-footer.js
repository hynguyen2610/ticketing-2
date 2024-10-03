import Script from 'next/script';

export default () => {
    return (
        <>
            <Script
                src="https://code.jquery.com/jquery-3.5.1.slim.min.js"
                strategy="beforeInteractive"
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.3/dist/umd/popper.min.js"
                strategy="beforeInteractive"
            />
            <Script
                src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"
                strategy="beforeInteractive"
            />
            <footer class="footer">
                <div class="container">
                    <span>&copy; 2023 Your Company</span>
                </div>
            </footer>
        </>

    );
}
