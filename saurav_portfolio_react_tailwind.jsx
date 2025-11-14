import React, { useEffect, useState, useRef } from "react";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";

// Single-file React component (Tailwind CSS required in host project)
// Features:
// - Tailwind-based professional UI
// - Preloader
// - Typing effect on hero
// - Admin-only project upload area (password protected, client-side)
// - Uploaded projects saved to localStorage
// - Only projects with `published: true` show to public viewers
// - Admin can toggle publish/unpublish and delete projects
// - Resume generation as PDF and TXT using jsPDF + download
// - Accessible and responsive

const ADMIN_PASSWORD = "admin123"; // change this before publishing to production
const LS_KEY = "saurav_portfolio_projects_v1";

function useTyping(texts = [], speed = 80, pause = 1200) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [isDeleting, setDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const current = texts[index % texts.length];

    if (!isDeleting) {
      timer = setTimeout(() => {
        setDisplay(current.slice(0, display.length + 1));
        if (display.length + 1 === current.length) {
          setTimeout(() => setDeleting(true), pause);
        }
      }, speed);
    } else {
      timer = setTimeout(() => {
        setDisplay(current.slice(0, display.length - 1));
        if (display.length - 1 === 0) {
          setDeleting(false);
          setIndex((i) => i + 1);
        }
      }, speed / 2);
    }

    return () => clearTimeout(timer);
  }, [display, isDeleting, index, texts, speed, pause]);

  return display;
}

export default function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ title: "", desc: "", image: null, publish: false });
  const fileInputRef = useRef(null);

  const heroTyping = useTyping(["Full Stack Developer", "Creative Problem Solver", "Open to Collaboration"], 80, 1100);

  // Load projects from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        setProjects(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse projects from localStorage", e);
      }
    }

    // simulate preloader timing
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Save projects to localStorage when changed
  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(projects));
  }, [projects]);

  // Simple admin login (client-side only)
  function handleAdminLogin(password) {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setShowLogin(false);
    } else {
      alert("Incorrect password.");
    }
  }

  // Convert uploaded file to base64 (small images only)
  function fileToBase64(file) {
    return new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
  }

  async function handleProjectSubmit(e) {
    e.preventDefault();

    let imageData = null;
    if (form.image instanceof File) {
      try {
        imageData = await fileToBase64(form.image);
      } catch (err) {
        console.error(err);
        alert("Failed to read image file.");
        return;
      }
    } else if (typeof form.image === "string") {
      imageData = form.image;
    }

    const newProject = {
      id: Date.now(),
      title: form.title,
      desc: form.desc,
      image: imageData,
      published: !!form.publish,
      createdAt: new Date().toISOString(),
    };

    setProjects((p) => [newProject, ...p]);
    setForm({ title: "", desc: "", image: null, publish: false });
    if (fileInputRef.current) fileInputRef.current.value = null;
  }

  function handleDeleteProject(id) {
    if (!confirm("Delete this project?")) return;
    setProjects((p) => p.filter((x) => x.id !== id));
  }

  function togglePublish(id) {
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, published: !x.published } : x)));
  }

  // Resume generation using jsPDF
  function downloadPDFResume() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    let y = 40;

    doc.setFontSize(22);
    doc.setTextColor(36, 64, 98);
    doc.text("SAURAV", left, y);

    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text("Full Stack Developer — Mumbai, India", left, y + 24);

    y += 60;

    doc.setFontSize(14);
    doc.setTextColor(36, 64, 98);
    doc.text("Professional Summary", left, y);
    y += 18;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const summary = "Experienced Full Stack Developer with 3+ years building production web applications, passionate about usability and scalable architecture.";
    doc.text(summary, left, y, { maxWidth: 520 });
    y += 48;

    doc.setFontSize(14);
    doc.setTextColor(36, 64, 98);
    doc.text("Technical Skills", left, y);
    y += 18;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    const skills = "Frontend: React, Vue.js, Angular — Backend: Node.js, Express, Django — Databases: MongoDB, PostgreSQL — Cloud: AWS, Docker";
    doc.text(skills, left, y, { maxWidth: 520 });
    y += 48;

    doc.setFontSize(14);
    doc.setTextColor(36, 64, 98);
    doc.text("Featured Projects", left, y);
    y += 18;

    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);

    const featured = projects.filter((p) => p.published).slice(0, 4);
    if (featured.length === 0) {
      doc.text("No published projects in portfolio.", left, y);
    } else {
      featured.forEach((p) => {
        doc.setFontSize(12);
        doc.setTextColor(36, 64, 98);
        doc.text(p.title, left, y);
        y += 16;
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(p.desc, left, y, { maxWidth: 520 });
        y += 48;
        if (y > 700) {
          doc.addPage();
          y = 40;
        }
      });
    }

    doc.save("Saurav_Resume.pdf");
  }

  function downloadTxtResume() {
    const content = `SAURAV - Full Stack Developer\nEmail: saurav@example.com\nPhone: +91 98765 43210\nLocation: Mumbai, India\n\nProfessional Summary:\nExperienced Full Stack Developer with 3+ years...`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Saurav_Resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Preloader */}
      {loading ? (
        <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-4 border-gray-200"></div>
        </div>
      ) : null}

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-red-600">Saurav</div>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
              <a href="#home" className="hover:text-red-600">Home</a>
              <a href="#about" className="hover:text-red-600">About</a>
              <a href="#projects" className="hover:text-red-600">Projects</a>
              <a href="#contact" className="hover:text-red-600">Contact</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => downloadPDFResume()} className="px-3 py-2 bg-red-600 text-white rounded-full text-sm shadow">Download PDF</button>
            <button onClick={() => downloadTxtResume()} className="px-3 py-2 border border-gray-300 rounded-full text-sm">Download TXT</button>

            {!isAdmin ? (
              <button onClick={() => setShowLogin(true)} className="ml-2 px-3 py-2 bg-gray-800 text-white rounded">Admin</button>
            ) : (
              <button onClick={() => { setIsAdmin(false); alert('Logged out of admin.'); }} className="ml-2 px-3 py-2 bg-yellow-500 text-black rounded">Logout</button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="pt-12">
        <div className="max-w-6xl mx-auto px-4 py-12 lg:py-20 flex flex-col lg:flex-row gap-8 items-center">
          <motion.div initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Hi, I'm <span className="text-red-600">Saurav</span></h1>
            <p className="mt-4 text-xl text-gray-700">{heroTyping}<span className="blinking-cursor">|</span></p>

            <div className="mt-6 flex gap-3 flex-wrap">
              <a href="#projects" className="px-5 py-3 bg-red-600 text-white rounded-full shadow">See Projects</a>
              <a onClick={() => downloadPDFResume()} className="px-5 py-3 border border-gray-300 rounded-full cursor-pointer">Get Resume</a>
            </div>

            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm font-semibold text-red-600">Experience</div>
                <div className="text-lg font-bold">3+ years</div>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm font-semibold text-red-600">Location</div>
                <div className="text-lg font-bold">Mumbai</div>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm font-semibold text-red-600">Open to</div>
                <div className="text-lg font-bold">Freelance / Full-time</div>
              </div>
              <div className="p-4 bg-white rounded shadow">
                <div className="text-sm font-semibold text-red-600">Community</div>
                <div className="text-lg font-bold">200+ members</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="flex-1 flex justify-center">
            <div className="w-64 h-64 md:w-72 md:h-72 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 shadow-xl flex items-center justify-center text-white text-6xl">👨‍💻</div>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-red-600">About Me</h2>
              <p className="mt-4 text-gray-700">I'm a passionate Full Stack Developer... I build production-ready web applications and love mentoring and community work.</p>
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <li className="bg-gray-50 p-3 rounded">React / Vue / Angular</li>
                <li className="bg-gray-50 p-3 rounded">Node.js / Django</li>
                <li className="bg-gray-50 p-3 rounded">MongoDB / PostgreSQL</li>
                <li className="bg-gray-50 p-3 rounded">AWS / Docker</li>
              </ul>
            </div>

            <div className="p-6 bg-gray-50 rounded">
              <div className="text-sm text-gray-500">Contact</div>
              <div className="font-bold mt-2">saurav@example.com</div>
              <div className="mt-3 text-sm text-gray-600">Mumbai, India</div>
              <div className="mt-4">
                <a href="#contact" className="inline-block px-4 py-2 bg-red-600 text-white rounded">Contact Me</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects - shows only published projects to viewers */}
      <section id="projects" className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-red-600">Projects</h2>
            <div className="text-sm text-gray-600">Showing only published projects to viewers</div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.filter((p) => p.published).length === 0 ? (
              <div className="col-span-full p-6 bg-white rounded shadow text-gray-600">No public projects yet. If you're the admin, upload and publish projects in the admin area.</div>
            ) : (
              projects
                .filter((p) => p.published)
                .map((p) => (
                  <article key={p.id} className="bg-white rounded shadow overflow-hidden">
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="object-cover w-full h-40" />
                      ) : (
                        <div className="text-4xl">📁</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-red-600">{p.title}</h3>
                      <p className="mt-2 text-gray-600 text-sm">{p.desc}</p>
                    </div>
                  </article>
                ))
            )}
          </div>

          {/* Admin panel (client-side only) */}
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Admin Dashboard</h3>
              <div className="text-sm text-gray-500">Client-side demo — not secure for production</div>
            </div>

            {!isAdmin ? (
              <div className="mt-4">
                <button onClick={() => setShowLogin(true)} className="px-4 py-2 bg-gray-800 text-white rounded">Login as Admin</button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-white rounded shadow">
                  <form onSubmit={handleProjectSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 block w-full border border-gray-200 rounded px-3 py-2" />
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea required value={form.desc} onChange={(e) => setForm((f) => ({ ...f, desc: e.target.value }))} className="mt-1 block w-full border border-gray-200 rounded px-3 py-2" rows={4}></textarea>
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700">Image (optional)</label>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => setForm((f) => ({ ...f, image: e.target.files[0] }))} className="mt-1" />
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <label className="flex items-center gap-2 text-sm"> <input type="checkbox" checked={form.publish} onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked }))} /> Publish now</label>
                      <button type="submit" className="ml-auto px-4 py-2 bg-red-600 text-white rounded">Upload Project</button>
                    </div>
                  </form>
                </div>

                <div className="p-6 bg-white rounded shadow">
                  <h4 className="font-semibold">Manage Projects</h4>
                  <div className="mt-3 space-y-3 max-h-72 overflow-auto">
                    {projects.length === 0 ? (
                      <div className="text-gray-500">No projects uploaded yet.</div>
                    ) : (
                      projects.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 border rounded p-2">
                          <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded">{p.image ? <img src={p.image} alt={p.title} className="object-cover w-full h-full rounded" /> : <span>📁</span>}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{p.title}</div>
                            <div className="text-xs text-gray-500">{p.published ? "Public" : "Private"} • {new Date(p.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePublish(p.id)} className={`px-3 py-1 text-sm rounded ${p.published ? 'bg-yellow-200' : 'bg-green-100'}`}>{p.published ? 'Unpublish' : 'Publish'}</button>
                            <button onClick={() => handleDeleteProject(p.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">Delete</button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-red-600">Contact</h2>
          <p className="mt-2 text-gray-600">Interested in working together? Send a message.</p>

          <form className="mt-6 bg-gray-50 p-6 rounded shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="p-3 border border-gray-200 rounded" placeholder="Your name" />
              <input className="p-3 border border-gray-200 rounded" placeholder="Your email" />
            </div>
            <textarea className="mt-4 p-3 border border-gray-200 rounded w-full" rows={4} placeholder="Message"></textarea>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-red-600 text-white rounded">Send Message</button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} Saurav — Built with ❤️</div>
          <div className="text-sm">Made with React + Tailwind + jsPDF</div>
        </div>
      </footer>

      {/* Admin Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow p-6 w-full max-w-md">
            <h3 className="font-semibold">Admin Login</h3>
            <p className="text-sm text-gray-500 mt-1">Enter admin password to access the upload panel.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const pw = e.target.elements.password.value;
                handleAdminLogin(pw);
              }}
              className="mt-4"
            >
              <input name="password" type="password" placeholder="Password" className="w-full p-3 border border-gray-200 rounded" />
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowLogin(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.blinking-cursor{animation:blink 1s steps(2,end) infinite}@keyframes blink{from,to{opacity:0}50%{opacity:1}}`}</style>
    </div>
  );
}
