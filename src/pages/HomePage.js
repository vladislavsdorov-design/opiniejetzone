import React, { useState, useEffect } from "react";
import { db, canUserClick, recordClick } from "../firebase";
import { ref, get } from "firebase/database";
import "../styles/HomePage.css";

function HomePage() {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clickedInstructor, setClickedInstructor] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  // Pobieramy lub tworzymy ID użytkownika
  const getUserId = () => {
    let userId = localStorage.getItem("jetzone24_userId");
    if (!userId) {
      userId =
        "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("jetzone24_userId", userId);
    }
    return userId;
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const instructorsRef = ref(db, "instructors");
      const snapshot = await get(instructorsRef);
      const instructorsData = [];

      if (snapshot.exists()) {
        const data = snapshot.val();
        for (let id in data) {
          instructorsData.push({
            id: id,
            ...data[id],
            clicks: data[id].clicks || 0,
          });
        }
        // Sortujemy według daty utworzenia (nowe na górze)
        instructorsData.sort((a, b) => {
          return (b.createdAt || 0) - (a.createdAt || 0);
        });
      }

      setInstructors(instructorsData);
      setLoading(false);
    } catch (error) {
      console.error("Błąd podczas pobierania instruktorów:", error);
      setLoading(false);
    }
  };

  const handleInstructorClick = async (instructor) => {
    // Weryfikacja tymczasowo wyłączona
    const userId = getUserId();
    const canClick = await canUserClick(instructor.id, userId);

    if (!canClick) {
      alert(
        "Już zostawiłeś opinię o tym instruktorze w tym tygodniu. Spróbuj ponownie za 7 dni!"
      );
      return;
    }

    setSelectedInstructor(instructor);
    setShowReviewModal(true);
  };

  const handleConfirmClick = async () => {
    if (!selectedInstructor) return;

    const userId = getUserId();
    const success = await recordClick(
      selectedInstructor.id,
      selectedInstructor.name,
      userId
    );

    if (success) {
      // Aktualizujemy licznik kliknięć w UI
      setInstructors(
        instructors.map((inst) =>
          inst.id === selectedInstructor.id
            ? { ...inst, clicks: (inst.clicks || 0) + 1 }
            : inst
        )
      );

      setClickedInstructor(selectedInstructor);
      setShowReviewModal(false);

      // Otwieramy Google Maps z opiniami po 1 sekundzie
      setTimeout(() => {
        window.open(
          "https://www.google.com/maps/place/Symulator+lot%C3%B3w+%E2%80%93+JetZone24/@52.1773251,21.0147617,17.2z/data=!4m6!3m5!1s0x471ecb303ffa339b:0x41e95881aa29c11a!8m2!3d52.1774841!4d21.0168293!16s%2Fg%2F11fnqm329p?entry=ttu&g_ep=EgoyMDI2MDMyNC4wIKXMDSoASAFQAw%3D%3D",
          "_blank"
        );
      }, 1000);
    } else {
      alert("Wystąpił błąd. Proszę spróbować ponownie.");
    }
  };

  const handleCloseModal = () => {
    setShowReviewModal(false);
    setSelectedInstructor(null);
  };

  if (loading) {
    return <div className="loading-container">Ładowanie instruktorów...</div>;
  }

  return (
    <div className="home-container">
      <video autoPlay loop muted playsInline className="video-bg">
        <source src="/fonvideo.mp4" type="video/mp4" />
      </video>

      {/* Przyciemnienie */}
      <div className="video-overlay"></div>
      <header className="hero-section">
        <h1 className="main-title">JetZone24 Opinie</h1>
        <p className="subtitle">
          Wybierz instruktora i zostaw opinię o jego pracy
        </p>
      </header>

      <div className="instructors-grid">
        {instructors.map((instructor) => (
          <div key={instructor.id} className="instructor-card">
            <div className="card-header">
              <div className="instructor-avatar">
                {instructor.photoUrl ? (
                  <img src={instructor.photoUrl} alt={instructor.name} />
                ) : (
                  <div className="avatar-placeholder">
                    {instructor.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="click-badge">
                <i
                  className="fa-brands fa-strava"
                  style={{ color: "rgb(0, 0, 0)" }}
                ></i>{" "}
                {instructor.clicks || 0} opinii
              </div>
              <img className="logofot" src="/logojet.png"></img>
            </div>

            <h3 className="instructor-name">{instructor.name}</h3>
            <p className="instructor-bio">
              {instructor.bio || "Profesjonalny instruktor JetZone24"}
            </p>

            <button
              onClick={() => handleInstructorClick(instructor)}
              className="review-btn"
            >
              Zostaw opinię
            </button>
          </div>
        ))}
      </div>

      {/* Okno modalne z potwierdzeniem */}
      {showReviewModal && selectedInstructor && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal}>
              ×
            </button>
            <div className="modal-icon">✍️</div>
            <h2>Zostaw opinię o instruktorze</h2>
            <p className="modal-instructor-name">{selectedInstructor.name}</p>
            <p className="modal-text">
              Zostaniesz przekierowany na stronę Google Maps, gdzie będziesz
              mógł zostawić opinię o pracy instruktora.
            </p>
            <div className="modal-buttons">
              <button
                onClick={handleCloseModal}
                className="modal-btn cancel-btn"
              >
                Anuluj
              </button>
              <button
                onClick={handleConfirmClick}
                className="modal-btn confirm-btn"
              >
                Przejdź do opinii
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Powiadomienie o udanym kliknięciu */}
      {clickedInstructor && (
        <div className="success-toast">
          Dziękujemy! Zostaniesz przekierowany, aby zostawić opinię o{" "}
          {clickedInstructor.name}
        </div>
      )}

      {/* Stopka */}
      <footer className="site-footer">
        <div className="footer-inner">
          <p className="footer-brand">
            © {new Date().getFullYear()} JetZone24. Wszelkie prawa zastrzeżone.
          </p>
          <p className="footer-address">
            ul. Świeradowska 43, 02-662 Warszawa &nbsp;|&nbsp;
            contact@jetzone24.com
          </p>
          <p className="footer-note">
            Opinie publikowane są na platformie Google Maps i podlegają jej
            regulaminowi. JetZone24 nie ponosi odpowiedzialności za treść
            komentarzy pozostawionych przez użytkowników.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
