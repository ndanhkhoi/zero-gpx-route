# Zero GPX Route Generator

Công cụ trực tuyến giúp vẽ và tạo tuyến đường chạy bộ/đi bộ giả lập dưới định dạng GPX.

Dự án được deploy tại [ghostrun.khoinda.vn](https://ghostrun.khoinda.vn).

## Tính năng

- **Hai chế độ vẽ** — Click từng điểm hoặc vẽ tự do (freehand) trên bản đồ
- **Tìm kiếm địa điểm** qua Nominatim geocoder
- **Preview real-time** — thay đổi thông số và xem tuyến đường cập nhật ngay trên bản đồ
- **Tạo nhiều vòng lặp** với độ lệch ngẫu nhiên (seeded) để tạo lộ trình đa dạng, tự nhiên
- **Transition curve** giữa các vòng lặp bằng đường cong Bezier
- **Preset tự động** — Chuyển đổi giữa Chạy bộ/Đi bộ sẽ tự động điều chỉnh pace, độ lệch, độ cao
- **Xuất GPX** với timestamp, elevation, và tên file tự động theo thời gian trong ngày
- **Responsive** — hoạt động trên desktop, tablet, và mobile
- **Hỗ trợ touch** — vẽ tự do bằng cảm ứng trên di động

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | Vite 8 + TypeScript 6 |
| Map | MapLibre GL JS |
| Styling | Tailwind CSS v4 + custom theme |
| Date/Time | date-fns + date-fns-tz |
| Icons | Font Awesome 6 |

## Cấu trúc source

```
src/
  main.ts                  Entry point, orchestration
  types/route.ts           TypeScript types (LatLng, DrawMode, RouteType)
  state/app-state.ts       Centralized app state
  dom/elements.ts          DOM element references
  map/
    map-instance.ts        MapLibre map initialization
    geocoder.ts            Nominatim API + debounce
    geocoder-ui.ts         Geocoder UI component
    route-layer.ts         GeoJSON source/layer for route line
  drawing/
    click-drawing.ts       Click mode: marker placement + interpolation
    freehand-drawing.ts    Freehand mode: pointer/touch tracking
    interpolation.ts       Point interpolation between markers
  preview/
    loop-builder.ts        Loop duplication + transition curves
    preview-renderer.ts    Preview layer management + RAF debouncing
  export/
    gpx-generator.ts       GPX XML generation
    export-controller.ts   Export orchestration + file download
  shared/
    geo.ts                 Haversine distance
    time.ts                Timezone-aware time helpers (Asia/Ho_Chi_Minh)
    random.ts              Seeded PRNG for deterministic offsets
  ui/
    modal.ts               Alert + confirm dialogs
    status.ts              Button states + route info display
  styles.css               Tailwind imports + custom CSS variables/components
```

## Development

```bash
npm install
npm run dev      # Vite dev server
npm run build    # TypeScript check + production build
npm run preview  # Serve production build locally
```

## Hướng dẫn sử dụng

Xem chi tiết tại [USER_GUIDE.md](USER_GUIDE.md).

## Giấy phép

Dự án được phân phối dưới giấy phép ISC. Xem file `LICENSE` để biết thêm chi tiết.

> [!NOTE]
> Dự án này được phát triển chỉ nhằm mục đích nghiên cứu và học tập. Việc sử dụng dữ liệu giả lập để tải lên các nền tảng theo dõi hoạt động thể thao có thể vi phạm điều khoản sử dụng của các nền tảng đó.
