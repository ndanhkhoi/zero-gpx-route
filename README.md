# Zero GPX Route Generator

Zero GPX Route Generator là một công cụ trực tuyến cho phép người dùng vẽ và tạo ra các tuyến đường chạy bộ giả lập dưới định dạng GPX để tải lên các ứng dụng theo dõi hoạt động thể thao như Strava, Garmin Connect, và các ứng dụng tương tự.

## Tính năng chính

- **Vẽ tuyến đường chạy bộ** trên bản đồ với giao diện đơn giản, trực quan
- **Làm mịn đường chạy** bằng cách tự động thêm các điểm nội suy giữa các điểm đánh dấu
- **Tạo nhiều vòng lặp lại** với độ lệch ngẫu nhiên để tạo ra các tuyến đường đa dạng
- **Xuất file GPX** với các thông số như thời gian, tốc độ, độ cao được thiết lập tùy chỉnh
- **Xem trước** tuyến đường hoàn chỉnh trước khi xuất file
- **Tùy chỉnh nhiều thông số** như tốc độ chạy, thời gian bắt đầu, độ cao
- **Hoàn toàn tương thích** với các thiết bị di động và màn hình có kích thước khác nhau

## Công nghệ sử dụng

- HTML/CSS/JavaScript thuần
- [Bootstrap](https://getbootstrap.com/) cho thiết kế responsive
- [Leaflet.js](https://leafletjs.com/) cho hiển thị bản đồ
- [Day.js](https://day.js.org/) cho xử lý thời gian
- [Font Awesome](https://fontawesome.com/) cho các biểu tượng

## Cài đặt và sử dụng

1. Clone repository này:
```
git clone https://github.com/ndanhkhoi/zero-gpx-route.git
```

2. Mở file `index.html` trong trình duyệt web để sử dụng ứng dụng.

Hoặc truy cập phiên bản trực tuyến tại: [https://zero-gpx-route.ndanhkhoi.name.vn](https://zero-gpx-route.ndanhkhoi.name.vn)

## Tương thích với thiết bị di động

Ứng dụng được thiết kế để hoạt động trên nhiều loại thiết bị khác nhau:
- Máy tính để bàn/laptop
- Máy tính bảng
- Điện thoại di động (Android, iOS)

Giao diện người dùng sẽ tự điều chỉnh để phù hợp với kích thước màn hình của thiết bị, mang lại trải nghiệm người dùng tốt nhất trên mọi nền tảng.

## Tài liệu hướng dẫn

Xem hướng dẫn sử dụng chi tiết tại [USER_GUIDE.md](USER_GUIDE.md)

## Giấy phép

Dự án này được phân phối dưới giấy phép MIT. Xem file `LICENSE` để biết thêm chi tiết.

## Lưu ý

Dự án này được phát triển chỉ nhằm mục đích nghiên cứu và học tập. Việc sử dụng dữ liệu giả lập để tải lên các nền tảng theo dõi hoạt động thể thao có thể vi phạm điều khoản sử dụng của các nền tảng đó.
