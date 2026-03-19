# Backend (WDP_BE) – Danh sách cần sửa

Gửi cho đồng đội phụ trách backend. Chỉ sửa trong repo **WDP_BE**, không đụng WDP_MOBILE.

---

## 1. Rescue team gửi ảnh khi hoàn thành nhiệm vụ

| Bước | File | Việc làm |
|------|------|----------|
| 1 | `src/models/rescue_requests.model.js` | Thêm field **`completion_media_urls`**: kiểu JSON (mảng), `allowNull: true`, `defaultValue: []`. |
| 2 | `src/services/rescue_request.js` | Trong **`completeMission`**: thêm tham số thứ 4 `completionMediaUrls` (mảng, optional). Trong `request.update(...)` thêm `completion_media_urls: completionMediaUrls \|\| []`. |
| 3 | `src/controllers/rescue_requests.js` | Trong **`completeMission`**: lấy từ `req.body` **`completion_media_urls`** (array), truyền xuống service khi gọi `completeMission`. |
| (Tùy chọn) | `src/services/rescue_request.js` | Trong **`updateRescueRequest`**: thêm **`completion_media_urls`** vào `allowedFields` nếu cho phép rescue_team cập nhật ảnh trước khi bấm hoàn thành. |

---

## 2. Đồng bộ request (rescue team xem thêm nhiệm vụ đã xong)

| File | Việc làm |
|------|----------|
| `src/services/rescue_request.js` | Trong **`getMyTeamMissions`**: hiện chỉ lấy request `status: "on_mission"`. Nếu cần trả cả nhiệm vụ **đã hoàn thành**, mở rộng điều kiện (vd `status: { [Op.in]: ["on_mission", "completed"] }`). |

---

## 3. Kiểm kê vật phẩm (rescue team)

| Bước | File | Việc làm |
|------|------|----------|
| 1 | `src/routes/supplies.route.js` | Thêm route **GET /supplies/my-team-distributions** (middleware rescue_team). |
| 2 | `src/controllers/supplies.js` | Thêm action **getMyTeamDistributions**: lấy user hiện tại → tìm RescueTeam theo `user_id` → trả về distributions (và thông tin supply) có `team_id` = đội đó, có phân trang. |
| 3 | `src/services/supply.js` | Thêm hàm **getDistributionsByTeamId(teamId, page, limit)**. |

---

## 4. Báo cáo thu hồi xe (rescue team)

| Bước | File | Việc làm |
|------|------|----------|
| 1 | `src/routes/vehicle_requests.route.js` | Thêm route **POST /vehicle-requests/:id/report-return** (middleware rescue_team), kiểm tra vehicle request thuộc đội của user. |
| 2 | `src/controllers/vehicle_requests.js` | Thêm action **reportReturnByTeam**: nhận `id`, lấy RescueTeam của user, kiểm tra `team_id` → cập nhật trạng thái (vd đã báo cáo trả) và/hoặc chuyển bước Manager xác nhận thu hồi. |
| 3 | `src/services/vehicle_request.js` | Thêm hàm xử lý: kiểm tra quyền đội, cập nhật status vehicle_request (và vehicle nếu cần). |
| (Tùy chọn) | `src/routes/vehicle_requests.route.js` | **GET /vehicle-requests/my-team** (rescue_team) – trả về danh sách yêu cầu xe của đội. |

---

## 5. (Tùy chọn) API upload ảnh

| Việc làm |
|----------|
| Thêm endpoint **POST /api/upload** (hoặc **POST /api/upload/image**) nhận file ảnh (multipart), lưu lên đĩa/S3/Cloudinary, trả về **URL** trong response. Mobile dùng URL cho `media_urls` (citizen) và `completion_media_urls` (rescue team). |

---

## Tóm tắt nhanh

| # | Mục | Nội dung |
|---|-----|----------|
| 1 | Ảnh hoàn thành | Model thêm `completion_media_urls`; completeMission nhận và lưu mảng link ảnh. |
| 2 | Đồng bộ nhiệm vụ | getMyTeamMissions trả thêm request `completed`. |
| 3 | Kiểm kê vật phẩm | GET /supplies/my-team-distributions cho rescue_team. |
| 4 | Thu hồi xe | POST /vehicle-requests/:id/report-return cho rescue_team. |
| 5 | Upload ảnh | (Tùy) POST /upload trả về URL. |
