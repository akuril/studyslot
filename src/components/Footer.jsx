function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-body border-top py-3">
      <div className="container text-center text-secondary small">
        © {currentYear} HomeworkHQ · Built with React & Bootstrap · 🔒 Your data stays on this device
      </div>
    </footer>
  );
}

export default Footer;