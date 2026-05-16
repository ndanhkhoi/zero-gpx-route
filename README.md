# Zero GPX Route Generator

Công cụ web vẽ tuyến đường chạy bộ / đi bộ giả lập và xuất ra file GPX để tải lên Strava, Garmin Connect, hay bất kỳ ứng dụng theo dõi hoạt động thể thao nào hỗ trợ định dạng GPX.

Dự án được deploy tại [ghostrun.khoinda.vn](https://ghostrun.khoinda.vn).

> [!NOTE]
> Dự án phát triển với mục đích nghiên cứu và học tập. Việc sử dụng dữ liệu giả lập để tải lên các nền tảng theo dõi hoạt động thể thao có thể vi phạm điều khoản sử dụng của các nền tảng đó.

## Tính năng

- **Một chế độ vẽ thống nhất** — chấm để thêm điểm anchor (kéo và xoá được), nhấn-giữ rồi kéo để vẽ tự do, mix tuỳ ý trong cùng một tuyến
- **Hoàn tác** từng thao tác (Cmd/Ctrl+Z) hoặc xoá toàn bộ đường vẽ
- **Tìm kiếm địa điểm** qua Nominatim (OpenStreetMap)
- **Preview real-time** — đổi thông số thấy đường cập nhật ngay
- **Sinh nhiều vòng lặp** với offset noise mượt (smoothed random walk) để đường không zig-zag
- **Transition curve** giữa các vòng lặp bằng đường cong Bezier
- **Preset Chạy / Đi bộ** — auto chỉnh pace, độ lệch, độ cao theo loại hoạt động
- **Xuất GPX** với timestamp liên tục, elevation cố định + jitter seeded, tự cap còn ≤10 000 điểm để Strava/Garmin nuốt được
- **Hướng dẫn step-by-step** trong app, không cần đọc file md
- **Mobile-first** — vẽ bằng cảm ứng, layout thích ứng từ điện thoại đến desktop

## Tech Stack

| Layer     | Công nghệ                        |
|-----------|----------------------------------|
| Framework | Vite 8 + React 19 + TypeScript 6 |
| Map       | MapLibre GL JS                   |
| Styling   | Tailwind CSS v4 + custom CSS     |
| Date/Time | date-fns + date-fns-tz           |
| Icons     | Font Awesome 6                   |

## Cấu trúc source

```
src/
  main.tsx                 Entry point
  app.tsx                  Orchestration component (hooks + components)
  types/
    route.ts               LatLng, RouteType, DrawSegment (anchor | stroke)
    settings.ts            RouteSettings shape
  hooks/
    use-map-instance.ts    MapLibre init
    use-route-points.ts    Segments state + derived flat polyline
    use-route-settings.ts  Pace/offset/elevation/preset switching
    use-drawing.ts         Unified gesture: tap → anchor, drag → stroke
    use-preview-renderer.ts  RAF-debounced GeoJSON preview layers
    use-modal.ts           Alert/confirm modal state
  components/
    app-header.tsx         Header với logo + nav
    app-logo.tsx           SVG logo brand
    control-panel.tsx      Bảng điều khiển bên phải
    map-canvas.tsx         MapLibre container
    map-geocoder.tsx       Search box bản đồ
    map-toolbar.tsx        Vẽ / Hoàn tác / Xoá đường / Đặt lại
    route-status.tsx       Hiển thị quãng đường + thời gian
    route-type-toggle.tsx  Toggle Run / Walk
    slider-field.tsx       Setting card có slider
    date-time-picker.tsx   Custom button + native picker ẩn
    dark-modal.tsx         Alert/confirm dialog
    help-modal.tsx         Hướng dẫn step-by-step trong app
  drawing/
    interpolation.ts       Linear interpolation giữa anchors
    segments.ts            Flatten segments → polyline + Chaikin smoothing
  preview/
    loop-builder.ts        Loop duplication với smoothed random walk + Bezier transition
  export/
    gpx-generator.ts       GPX XML, escape, seeded elevation jitter
    export-controller.ts   Sub-sample về ≤10k điểm, save file
  map/
    geocoder.ts            Nominatim API + debounce
    route-layer.ts         GeoJSON source/layer cho route line
  shared/
    geo.ts                 Haversine distance
    time.ts                Timezone helpers (Asia/Ho_Chi_Minh)
    random.ts              Seeded PRNG (Park-Miller)
    presets.ts             ROUTE_PRESETS + DEFAULT_SETTINGS (single source of truth)
  styles.css               Tailwind import + custom CSS
```

## Development

```bash
bun install        # hoặc npm install
bun run dev        # Vite dev server
bun run build      # tsc + Vite build
bun run preview    # serve build
```

Không có test framework. TypeScript strict mode bật.

## Hướng dẫn sử dụng

Mở app → bấm "Hướng dẫn" trên header để xem 5 bước step-by-step trong modal.

## License

ISC. Xem `LICENSE`.
