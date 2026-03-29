import React, { useState, useEffect } from "react";
import { db, instructorsRef, clicksRef } from "../firebase";
import {
  ref,
  set,
  push,
  get,
  update,
  remove,
} from "firebase/database";
import "../styles/AdminPage.css";

function AdminPage({ onLogout }) {
  const [instructors, setInstructors] = useState([]);
  const [clicks, setClicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    photoUrl: "",
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Получаем инструкторов
      const instructorsSnapshot = await get(instructorsRef);
      const instructorsData = [];

      if (instructorsSnapshot.exists()) {
        const data = instructorsSnapshot.val();
        for (let id in data) {
          instructorsData.push({
            id: id,
            ...data[id],
            clicks: data[id].clicks || 0,
          });
        }
      }

      // Сортируем по дате создания (новые сверху)
      instructorsData.sort((a, b) => {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      setInstructors(instructorsData);

      // Получаем клики
      const clicksSnapshot = await get(clicksRef);
      const clicksData = [];

      if (clicksSnapshot.exists()) {
        const data = clicksSnapshot.val();
        for (let id in data) {
          clicksData.push({
            id: id,
            ...data[id],
          });
        }
        // Сортируем по времени
        clicksData.sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        );
      }

      setClicks(clicksData);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const handleAddInstructor = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Введите имя инструктора");
      return;
    }

    setUploading(true);
    try {
      const newInstructorRef = push(instructorsRef);
      await set(newInstructorRef, {
        name: formData.name,
        bio: formData.bio,
        photoUrl: formData.photoUrl || "",
        clicks: 0,
        createdAt: new Date().toISOString(),
      });

      setFormData({ name: "", bio: "", photoUrl: "" });
      setShowAddForm(false);
      await fetchAllData();
      alert("Инструктор успешно добавлен!");
    } catch (error) {
      console.error("Error adding instructor:", error);
      alert("Ошибка при добавлении инструктора");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateInstructor = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const instructorRef = ref(db, `instructors/${editingInstructor.id}`);
      await update(instructorRef, {
        name: formData.name,
        bio: formData.bio,
        photoUrl: formData.photoUrl,
      });

      setEditingInstructor(null);
      setFormData({ name: "", bio: "", photoUrl: "" });
      await fetchAllData();
      alert("Инструктор обновлен!");
    } catch (error) {
      console.error("Error updating instructor:", error);
      alert("Ошибка при обновлении");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteInstructor = async (instructorId) => {
    if (window.confirm("Вы уверены, что хотите удалить этого инструктора?")) {
      try {
        const instructorRef = ref(db, `instructors/${instructorId}`);
        await remove(instructorRef);
        await fetchAllData();
        alert("Инструктор удален");
      } catch (error) {
        console.error("Error deleting instructor:", error);
        alert("Ошибка при удалении");
      }
    }
  };

  const handleResetClicks = async (instructorId) => {
    if (window.confirm("Сбросить счетчик кликов для этого инструктора?")) {
      try {
        const instructorRef = ref(db, `instructors/${instructorId}`);
        await update(instructorRef, { clicks: 0 });
        await fetchAllData();
        alert("Счетчик сброшен");
      } catch (error) {
        console.error("Error resetting clicks:", error);
      }
    }
  };

  const totalClicks = instructors.reduce(
    (sum, inst) => sum + (inst.clicks || 0),
    0
  );
  const uniqueUsers = [...new Set(clicks.map((click) => click.userId))].length;

  if (loading) {
    return <div className="admin-loading">Загрузка админ панели...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>JetZone24 - Админ панель</h1>
        <div className="admin-stats">
          <div className="stat-badge">
            📊 Всего инструкторов: {instructors.length}
          </div>
          <div className="stat-badge">👁️ Всего отзывов: {totalClicks}</div>
          <div className="stat-badge">
            👤 Уникальных клиентов: {uniqueUsers}
          </div>
        </div>
      </div>

      <div className="admin-actions">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="action-btn add-btn"
        >
          {showAddForm ? "✖ Отменить" : "+ Добавить инструктора"}
        </button>
      </div>

      {showAddForm && (
        <div className="form-modal">
          <form onSubmit={handleAddInstructor} className="instructor-form">
            <h3>Добавить нового инструктора</h3>
            <input
              type="text"
              placeholder="Имя и фамилия *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Биография (опыт, достижения)"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows="3"
            />
            <input
              type="text"
              placeholder="Ссылка на фото (URL) - например: https://i.ibb.co/xxx/photo.jpg"
              value={formData.photoUrl}
              onChange={(e) =>
                setFormData({ ...formData, photoUrl: e.target.value })
              }
            />
            <button type="submit" disabled={uploading}>
              {uploading ? "Добавление..." : "Добавить инструктора"}
            </button>
          </form>
        </div>
      )}

      {editingInstructor && (
        <div className="form-modal">
          <form onSubmit={handleUpdateInstructor} className="instructor-form">
            <h3>Редактировать инструктора</h3>
            <input
              type="text"
              placeholder="Имя и фамилия"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Биография"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows="3"
            />
            <input
              type="text"
              placeholder="Ссылка на фото (URL)"
              value={formData.photoUrl}
              onChange={(e) =>
                setFormData({ ...formData, photoUrl: e.target.value })
              }
            />
            <div className="form-buttons">
              <button type="submit" disabled={uploading}>
                {uploading ? "Сохранение..." : "Сохранить изменения"}
              </button>
              <button type="button" onClick={() => setEditingInstructor(null)}>
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="instructors-table-container">
        <h2>Список инструкторов</h2>
        <table className="instructors-table">
          <thead>
            <tr>
              <th>Фото</th>
              <th>Имя</th>
              <th>Биография</th>
              <th>Отзывов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {instructors.map((instructor) => (
              <tr key={instructor.id}>
                <td>
                  {instructor.photoUrl ? (
                    <img
                      src={instructor.photoUrl}
                      alt={instructor.name}
                      className="table-photo"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML =
                          '<div class="table-photo-placeholder">📷</div>';
                      }}
                    />
                  ) : (
                    <div className="table-photo-placeholder">📷</div>
                  )}
                </td>
                <td className="instructor-name-cell">{instructor.name}</td>
                <td className="instructor-bio-cell">{instructor.bio || "-"}</td>
                <td className="clicks-cell">{instructor.clicks || 0}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => {
                      setEditingInstructor(instructor);
                      setFormData({
                        name: instructor.name,
                        bio: instructor.bio || "",
                        photoUrl: instructor.photoUrl || "",
                      });
                    }}
                    className="edit-btn"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleResetClicks(instructor.id)}
                    className="reset-btn"
                    title="Сбросить счетчик"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => handleDeleteInstructor(instructor.id)}
                    className="delete-btn"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="clicks-history">
        <h2>История переходов к отзывам</h2>
        <div className="clicks-list">
          {clicks.slice(0, 50).map((click) => (
            <div key={click.id} className="click-item">
              <div className="click-info">
                <strong>{click.instructorName}</strong>
                <span className="click-user">
                  Пользователь: {click.userId?.slice(-8)}
                </span>
              </div>
              <div className="click-time">
                {new Date(click.timestamp).toLocaleString("ru-RU")}
              </div>
            </div>
          ))}
          {clicks.length === 0 && <p>Нет переходов</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
