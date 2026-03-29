# Hướng dẫn sử dụng Zero GPX Route Generator

## Tổng quan

Zero GPX Route Generator cho phép bạn vẽ tuyến đường chạy bộ/đi bộ trên bản đồ, tùy chỉnh thông số, và xuất file GPX để tải lên các ứng dụng theo dõi hoạt động như Strava, Garmin Connect.

## Giao diện

Giao diện gồm hai phần chính:

- **Bản đồ** (bên trái) — hiển thị bản đồ MapLibre, thanh công cụ vẽ, và thông tin tuyến đường (khoảng cách, thời gian, trạng thái)
- **Bảng điều khiển** (bên phải) — chứa tất cả thông số và nút xuất GPX

Trên màn hình nhỏ (mobile/tablet), hai phần này sẽ xếp theo chiều dọc.

## Chế độ vẽ

Ứng dụng hỗ trợ hai chế độ vẽ:

### Click

1. Chọn **Click** ở thanh chế độ vẽ
2. Nhấn **Bắt đầu vẽ**
3. Click trên bản đồ để thêm các điểm đánh dấu
4. Hệ thống tự động nối suốt 10 điểm nội suy giữa mỗi cặp điểm
5. Kéo các điểm đánh dấu để điều chỉnh vị trí
6. Nhấn **Dừng vẽ** để kết thúc

### Tự do (Freehand)

1. Chọn **Tự do** ở thanh chế độ vẽ (mặc định)
2. Nhấn **Bắt đầu vẽ**
3. Nhấn và kéo trên bản đồ để vẽ tuyến đường (tương tự vẽ bằng bút)
4. Hỗ trợ cả touch trên di động
5. Nhấn **Dừng vẽ** để kết thúc

## Thông số

| Thông số | Mô tả | Mặc định |
|----------|-------|----------|
| Loại hoạt động | Chạy bộ hoặc Đi bộ | Chạy bộ |
| Thời gian bắt đầu | Thời điểm bắt đầu hoạt động | Thời gian hiện tại |
| Pace (phút/km) | Tốc độ chạy/đi bộ trung bình | 5.5 (chạy) / 12 (đi) |
| Số vòng lặp lại | Số lần lặp lại cùng một tuyến đường | 1 |
| Độ lệch nhỏ nhất (m) | Khoảng cách lệch ngang tối thiểu cho các vòng | 0.05 (chạy) / 0.1 (đi) |
| Độ lệch lớn nhất (m) | Khoảng cách lệch ngang tối đa cho các vòng | 0.2 (chạy) / 0.5 (đi) |
| Độ cao mặc định (m) | Giá trị elevation cho toàn bộ điểm GPX | 10 (chạy) / 5 (đi) |

Khi chuyển đổi loại hoạt động (Chạy bộ / Đi bộ), tất cả thông số sẽ tự động điều chỉnh theo preset phù hợp.

Mỗi thông số có hai cách nhập: kéo slider hoặc nhập số trực tiếp vào ô bên phải.

## Tìm kiếm địa điểm

Sử dụng thanh tìm kiếm góc trái trên bản đồ để tìm địa điểm. Kết quả từ Nominatim (OpenStreetMap) với hỗ trợ tiếng Việt.

## Xuất GPX

1. Vẽ ít nhất 2 điểm trên bản đồ
2. Tùy chỉnh thông số mong muốn
3. Nhấn nút **Xuất GPX** ở bảng điều khiển
4. File GPX sẽ được tải về tự động

Tên file GPX được tạo tự động theo quy tắc: `{Thời trong ngày}_{Loại hoạt động}_{Thời gian}.gpx`
Ví dụ: `Morning_Run_202603291430.gpx`

## Làm lại

Nhấn nút **Làm lại** để xóa toàn bộ dữ liệu vẽ và thông số, trở về trạng thái ban đầu. Hệ thống sẽ hiển thị dialog xác nhận trước khi thực hiện.

## Import vào Strava

### Hiển thị bản đồ hoạt động (màu cam thay vì màu xám)

1. Đăng nhập Strava, mở hoạt động đã import
2. Nhấn nút biểu tượng bút chì (Edit) hoặc ⋮ > Edit Activity
3. Trong mục Privacy Controls, chọn **Everyone** hoặc **Followers**
4. Nhấn **Save**

Bản đồ sẽ hiển thị màu cam khi hoạt động được đặt ở chế độ công khai.
