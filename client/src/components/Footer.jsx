function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-body border-top py-3">
      <div className="container text-center text-secondary small">
        © {currentYear} StudySlot · Tutoring for grades 6–12 · Built with React &amp; Bootstrap
      </div>
    </footer>
  );
}

export default Footer;
