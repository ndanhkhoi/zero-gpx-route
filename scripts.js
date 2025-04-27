document.addEventListener('DOMContentLoaded', () => {
    // Initialize dayjs timezone
    dayjs.extend(window.dayjs_plugin_utc);
    dayjs.extend(window.dayjs_plugin_timezone);
    dayjs.tz.setDefault("Asia/Ho_Chi_Minh");
    
    // Initialize map
    const map = L.map('map').setView([10.354175408990718, 106.40129754087178], 18); // Higher zoom level
    
    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Variables
    let isDrawing = false;
    let routePoints = [];
    let routeLine = null;
    let markers = [];
    let previewLines = [];
    let isPreviewActive = false;
    
    // DOM elements
    const addPointBtn = document.getElementById('add-point');
    const resetAppBtn = document.getElementById('reset-app');
    const exportGpxBtn = document.getElementById('export-gpx');
    const previewRouteBtn = document.getElementById('preview-route');
    const speedInput = document.getElementById('speed');
    const startTimeInput = document.getElementById('start-time');
    const totalDistanceEl = document.getElementById('total-distance');
    const totalTimeEl = document.getElementById('total-time');
    const routeTypeSelect = document.getElementById('route-type');
    const duplicateCountInput = document.getElementById('duplicate-count');
    const minOffsetInput = document.getElementById('min-offset');
    const maxOffsetInput = document.getElementById('max-offset');
    const elevationInput = document.getElementById('elevation');
    
    // Custom alert elements
    const customAlert = document.getElementById('custom-alert');
    const alertMessage = document.getElementById('alert-message');
    const alertOkBtn = document.getElementById('alert-ok');
    
    // Set default start time (current time)
    const now = dayjs().tz("Asia/Ho_Chi_Minh");
    startTimeInput.value = now.format('YYYY-MM-DDTHH:mm');
    
    // Custom alert function
    function showAlert(message) {
        alertMessage.textContent = message;
        
        // Reset footer to show just the OK button
        const alertFooter = document.getElementById('alert-footer');
        alertFooter.innerHTML = '<button id="alert-ok" class="primary">OK</button>';
        
        customAlert.classList.add('show');
        
        // Focus on OK button
        setTimeout(() => {
            document.getElementById('alert-ok').focus();
            
            // Add event listener to the newly created button
            document.getElementById('alert-ok').addEventListener('click', () => {
                customAlert.classList.remove('show');
            });
        }, 100);
    }
    
    // Update button states
    function updateButtonStates() {
        const hasPoints = routePoints.length > 1;
        
        if (isDrawing) {
            // While drawing, disable all buttons except Add Point
            exportGpxBtn.disabled = true;
            previewRouteBtn.disabled = true;
            // We keep reset enabled to allow cancellation
        } else {
            // After drawing, enable buttons if we have points
            exportGpxBtn.disabled = !hasPoints;
            previewRouteBtn.disabled = !hasPoints;
        }
        
        // Setting inputs should always be enabled
        speedInput.disabled = false;
        startTimeInput.disabled = false;
        routeTypeSelect.disabled = false;
        duplicateCountInput.disabled = false;
        minOffsetInput.disabled = false;
        maxOffsetInput.disabled = false;
        elevationInput.disabled = false;
    }
    
    // Add point button click handler
    addPointBtn.addEventListener('click', () => {
        isDrawing = !isDrawing;
        
        if (isDrawing) {
            addPointBtn.innerHTML = '<i class="fas fa-hand-paper"></i> Đang vẽ... (Bấm để dừng)';
            addPointBtn.classList.add('active');
            map.on('click', onMapClick);
        } else {
            addPointBtn.innerHTML = '<i class="fas fa-draw-polygon"></i> Thêm điểm';
            addPointBtn.classList.remove('active');
            map.off('click', onMapClick);
        }
        
        updateButtonStates();
    });
    
    // Map click handler
    function onMapClick(e) {
        const point = {
            lat: e.latlng.lat,
            lng: e.latlng.lng
        };
        
        addRoutePoint(point);
    }
    
    // Add a point to the route
    function addRoutePoint(point) {
        // Add the new point to routePoints
        if (routePoints.length > 0) {
            // Get the last point
            const lastPoint = routePoints[routePoints.length - 1];
            
            // Create interpolated points between the last point and the new point
            const interpolatedPoints = interpolatePoints(lastPoint, point, 10);
            
            // Add the interpolated points
            routePoints = [...routePoints, ...interpolatedPoints];
        } else {
            routePoints.push(point);
        }
        
        // Create marker (only for the clicked point, not interpolated points)
        const marker = L.marker([point.lat, point.lng], {
            draggable: true
        }).addTo(map);
        
        // Marker drag events
        marker.on('drag', function(e) {
            const index = markers.indexOf(this);
            if (index !== -1) {
                // Determine which actual point this marker corresponds to
                const actualIndex = findActualPointIndex(index);
                if (actualIndex !== -1) {
                    // Update the actual point position
                    routePoints[actualIndex] = e.target.getLatLng();
                    
                    // Recalculate interpolated points if needed
                    recalculateInterpolatedPoints();
                    
                    updateRouteLine();
                    updateRouteInfo();
                    
                    // Clear preview if it exists
                    if (isPreviewActive) {
                        clearPreview();
                        isPreviewActive = false;
                    }
                }
            }
        });
        
        markers.push(marker);
        
        // Update the polyline
        updateRouteLine();
        
        // Update info
        updateRouteInfo();
        
        // Update button states
        updateButtonStates();
        
        // Clear preview if it exists
        if (isPreviewActive) {
            clearPreview();
            isPreviewActive = false;
        }
    }
    
    // Helper function to find the actual index of a point in routePoints
    function findActualPointIndex(markerIndex) {
        if (routePoints.length <= markers.length) {
            return markerIndex;
        }
        
        // When using interpolation, markers are only at user-clicked points
        // We need to find the corresponding index in the routePoints array
        const numInterpolatedPoints = 10; // Number of points interpolated between each pair
        return markerIndex * (numInterpolatedPoints + 1);
    }
    
    // Function to recalculate all interpolated points when a marker is moved
    function recalculateInterpolatedPoints() {
        if (markers.length < 2) return;
        
        const originalPoints = [];
        
        // Extract the original user-clicked points
        markers.forEach(marker => {
            originalPoints.push({
                lat: marker.getLatLng().lat,
                lng: marker.getLatLng().lng
            });
        });
        
        // Recalculate all points with interpolation
        let newRoutePoints = [originalPoints[0]];
        
        for (let i = 1; i < originalPoints.length; i++) {
            const startPoint = originalPoints[i-1];
            const endPoint = originalPoints[i];
            const interpolated = interpolatePoints(startPoint, endPoint, 10);
            newRoutePoints = [...newRoutePoints, ...interpolated];
        }
        
        routePoints = newRoutePoints;
    }
    
    // Function to interpolate points between two points
    function interpolatePoints(point1, point2, numPoints) {
        const interpolatedPoints = [];
        
        for (let i = 1; i <= numPoints; i++) {
            const ratio = i / (numPoints + 1);
            const lat = point1.lat + (point2.lat - point1.lat) * ratio;
            const lng = point1.lng + (point2.lng - point1.lng) * ratio;
            
            interpolatedPoints.push({
                lat: lat,
                lng: lng
            });
        }
        
        // Add the end point
        interpolatedPoints.push(point2);
        
        return interpolatedPoints;
    }
    
    // Update route line
    function updateRouteLine() {
        // Remove existing line
        if (routeLine) {
            map.removeLayer(routeLine);
        }
        
        // Create new line if we have at least 2 points
        if (routePoints.length >= 2) {
            routeLine = L.polyline(routePoints, {
                color: '#3498db',
                weight: 5,
                opacity: 0.7
            }).addTo(map);
        }
    }
    
    // Calculate and update route information (distance and time)
    function updateRouteInfo() {
        let totalDistance = 0;
        
        if (routePoints.length >= 2) {
            for (let i = 1; i < routePoints.length; i++) {
                const prevPoint = L.latLng(routePoints[i-1].lat, routePoints[i-1].lng);
                const currentPoint = L.latLng(routePoints[i].lat, routePoints[i].lng);
                
                totalDistance += prevPoint.distanceTo(currentPoint);
            }
        }
        
        // Convert to kilometers and format
        const distanceKm = (totalDistance / 1000).toFixed(2);
        totalDistanceEl.textContent = `Tổng khoảng cách: ${distanceKm} km`;
        
        // Calculate total time based on pace
        const paceMinKm = parseFloat(speedInput.value) || 9.6; // minutes per km
        const totalMinutes = distanceKm * paceMinKm;
        
        // Format time as hours and minutes
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        
        let timeText = '';
        if (hours > 0) {
            timeText = `${hours} giờ ${minutes} phút`;
        } else {
            timeText = `${minutes} phút`;
        }
        
        totalTimeEl.textContent = `Tổng thời gian: ${timeText}`;
    }
    
    // Preview route with duplications
    function previewRoute() {
        if (routePoints.length < 2) {
            showAlert('Bạn chưa vẽ đường chạy! Cần ít nhất 2 điểm.');
            return;
        }
        
        // Clear existing preview
        clearPreview();
        
        // Get offset ranges in meters
        const minOffsetMeters = parseFloat(minOffsetInput.value) || 0.05;
        const maxOffsetMeters = parseFloat(maxOffsetInput.value) || 0.2;
        const duplicateCount = parseInt(duplicateCountInput.value) || 1;
        
        // Approximate conversion from meters to degrees
        // This is a rough approximation and varies by latitude
        const metersToDegreesLat = 0.000009;
        const metersToDegreesLng = 0.000011;
        
        // Draw preview lines for each duplicate
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'];
        
        let totalPreviewDistance = 0;
        
        for (let i = 0; i < duplicateCount; i++) {
            // Create an array for the offset points
            const offsetPoints = [];
            
            // Apply random offset to each point within the specified range
            routePoints.forEach(point => {
                // Generate random offset within min-max range
                const randomOffset = minOffsetMeters + Math.random() * (maxOffsetMeters - minOffsetMeters);
                
                // Randomly decide whether to add or subtract the offset for each dimension
                const latDirection = Math.random() > 0.5 ? 1 : -1;
                const lngDirection = Math.random() > 0.5 ? 1 : -1;
                
                // Calculate final offsets
                const latOffset = latDirection * randomOffset * metersToDegreesLat;
                const lngOffset = lngDirection * randomOffset * metersToDegreesLng;
                
                // Create new point with random offset
                offsetPoints.push({
                    lat: point.lat + latOffset,
                    lng: point.lng + lngOffset
                });
            });
            
            // Calculate the distance for this loop
            if (offsetPoints.length >= 2) {
                for (let j = 1; j < offsetPoints.length; j++) {
                    const prevPoint = L.latLng(offsetPoints[j-1].lat, offsetPoints[j-1].lng);
                    const currentPoint = L.latLng(offsetPoints[j].lat, offsetPoints[j].lng);
                    
                    totalPreviewDistance += prevPoint.distanceTo(currentPoint);
                }
            }
            
            // Create and add line to map
            const previewLine = L.polyline(offsetPoints, {
                color: colors[i % colors.length],
                weight: 5,
                opacity: 0.7
            }).addTo(map);
            
            previewLines.push(previewLine);
        }
        
        // Convert to kilometers and format
        const distanceKm = (totalPreviewDistance / 1000).toFixed(2);
        totalDistanceEl.textContent = `Tổng khoảng cách: ${distanceKm} km`;
        
        // Calculate total time based on pace
        const paceMinKm = parseFloat(speedInput.value) || 9.6; // minutes per km
        const totalMinutes = distanceKm * paceMinKm;
        
        // Format time as hours and minutes
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.floor(totalMinutes % 60);
        
        let timeText = '';
        if (hours > 0) {
            timeText = `${hours} giờ ${minutes} phút`;
        } else {
            timeText = `${minutes} phút`;
        }
        
        totalTimeEl.textContent = `Tổng thời gian: ${timeText}`;
        
        // Hide the original route line
        if (routeLine) {
            map.removeLayer(routeLine);
        }
        
        isPreviewActive = true;
    }
    
    // Clear preview lines
    function clearPreview() {
        if (previewLines.length > 0) {
            previewLines.forEach(line => {
                if (line && map.hasLayer(line)) {
                    map.removeLayer(line);
                }
            });
            previewLines = [];
        }
        
        // Restore original route line
        updateRouteLine();
    }
    
    // Preview route button
    previewRouteBtn.addEventListener('click', previewRoute);
    
    // Reset app
    function resetApp() {
        // If we're in drawing mode, exit it
        if (isDrawing) {
            isDrawing = false;
            addPointBtn.innerHTML = '<i class="fas fa-draw-polygon"></i> Thêm điểm';
            addPointBtn.classList.remove('active');
            map.off('click', onMapClick);
        }
        
        // Remove all markers
        markers.forEach(marker => {
            map.removeLayer(marker);
        });
        
        // Remove route line
        if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
        }
        
        // Clear preview
        clearPreview();
        isPreviewActive = false;
        
        // Reset variables
        routePoints = [];
        markers = [];
        
        // Reset form to defaults
        speedInput.value = '9.6';
        duplicateCountInput.value = '1';
        minOffsetInput.value = '0.05';
        maxOffsetInput.value = '0.2';
        elevationInput.value = '10';
        routeTypeSelect.value = 'run';
        
        // Reset time to current time
        const resetTime = dayjs().tz("Asia/Ho_Chi_Minh");
        startTimeInput.value = resetTime.format('YYYY-MM-DDTHH:mm');
        
        // Update info
        totalDistanceEl.textContent = 'Tổng khoảng cách: 0 km';
        totalTimeEl.textContent = 'Tổng thời gian: 0 phút';
        
        // Update button states
        updateButtonStates();
    }
    
    // Reset app button click handler
    resetAppBtn.addEventListener('click', () => {
        if (routePoints.length > 0) {
            // Use custom alert instead of browser confirm
            const confirmDiv = document.createElement('div');
            confirmDiv.innerHTML = `
                <p>Bạn có chắc chắn muốn làm lại từ đầu?</p>
            `;
            
            alertMessage.innerHTML = '';
            alertMessage.appendChild(confirmDiv);
            
            // Setup footer with confirm buttons
            const alertFooter = document.getElementById('alert-footer');
            alertFooter.innerHTML = `
                <button id="confirm-cancel" class="secondary">Hủy</button>
                <button id="confirm-reset" class="primary">Đồng ý</button>
            `;
            
            customAlert.classList.add('show');
            
            // Setup event handlers
            document.getElementById('confirm-cancel').addEventListener('click', () => {
                // Restore the OK button
                alertFooter.innerHTML = '<button id="alert-ok" class="primary">OK</button>';
                customAlert.classList.remove('show');
            });
            
            document.getElementById('confirm-reset').addEventListener('click', () => {
                // Restore the OK button
                alertFooter.innerHTML = '<button id="alert-ok" class="primary">OK</button>';
                customAlert.classList.remove('show');
                resetApp();
            });
        } else {
            resetApp();
        }
    });
    
    // Export GPX
    exportGpxBtn.addEventListener('click', () => {
        if (routePoints.length < 2) {
            showAlert('Bạn chưa vẽ đường chạy! Cần ít nhất 2 điểm.');
            return;
        }
        
        // Get user settings
        const paceMinKm = parseFloat(speedInput.value) || 9.6; // minutes per km
        const duplicateCount = parseInt(duplicateCountInput.value) || 1;
        const minOffsetMeters = parseFloat(minOffsetInput.value) || 0.05;
        const maxOffsetMeters = parseFloat(maxOffsetInput.value) || 0.2;
        const elevation = parseFloat(elevationInput.value) || 10;
        const routeType = routeTypeSelect.value;
        
        // Calculate speed in meters per second
        const speedMetersSec = (1000 / (paceMinKm * 60));
        
        // Get start time
        let startTime;
        if (startTimeInput.value) {
            startTime = dayjs.tz(startTimeInput.value, "Asia/Ho_Chi_Minh").toDate();
        } else {
            startTime = dayjs().tz("Asia/Ho_Chi_Minh").toDate();
        }
        
        // Generate proper activity name based on time of day
        const activityName = generateActivityName(startTime, routeType);
        
        // Approximate conversion from meters to degrees
        const metersToDegreesLat = 0.000009;
        const metersToDegreesLng = 0.000011;
        
        // Create array to hold all route points
        let allRoutePoints = [];
        
        // Create a 2D array to hold each route separately for proper time sequencing
        const routesArray = [];
        
        for (let i = 0; i < duplicateCount; i++) {
            const currentRoute = [];
            
            // Apply random offset to each point within the specified range
            routePoints.forEach(point => {
                // Generate random offset within min-max range
                const randomOffset = minOffsetMeters + Math.random() * (maxOffsetMeters - minOffsetMeters);
                
                // Randomly decide whether to add or subtract the offset for each dimension
                const latDirection = Math.random() > 0.5 ? 1 : -1;
                const lngDirection = Math.random() > 0.5 ? 1 : -1;
                
                // Calculate final offsets
                const latOffset = latDirection * randomOffset * metersToDegreesLat;
                const lngOffset = lngDirection * randomOffset * metersToDegreesLng;
                
                // Add new point with random offset to this route
                currentRoute.push({
                    lat: point.lat + latOffset,
                    lng: point.lng + lngOffset,
                    routeIndex: i
                });
            });
            
            routesArray.push(currentRoute);
            allRoutePoints = allRoutePoints.concat(currentRoute);
        }
        
        // Generate GPX
        const gpxContent = generateGPX(allRoutePoints, speedMetersSec, startTime, activityName, elevation);
        
        // Create file and trigger download
        const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
        const url = URL.createObjectURL(blob);
        
        const formattedStartTime = dayjs(startTime).format('YYYYMMDDHHmm');
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activityName.replace(/\s+/g, '_')}_${formattedStartTime}.gpx`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
        
        showAlert('File GPX đã được tạo thành công!');
    });
    
    // Generate activity name based on time of day
    function generateActivityName(date, routeType) {
        const hour = date.getHours();
        let timeOfDay = '';
        
        if (hour >= 5 && hour < 12) {
            timeOfDay = 'Morning';
        } else if (hour >= 12 && hour < 17) {
            timeOfDay = 'Afternoon';
        } else if (hour >= 17 && hour < 21) {
            timeOfDay = 'Evening';
        } else {
            timeOfDay = 'Night';
        }
        
        const activityType = routeType === 'run' ? 'Run' : 'Walk';
        
        return `${timeOfDay} ${activityType}`;
    }
    
    // Generate GPX file content
    function generateGPX(points, speedMetersSec, startTime, activityName, elevation) {
        const header = '<?xml version="1.0" encoding="UTF-8"?>' +
            '<gpx version="1.1" creator="Zero GPX Route Generator" xmlns="http://www.topografix.com/GPX/1/1">' +
            '<metadata>' +
            '<name>' + activityName + '</name>' +
            '<time>' + dayjs(startTime).toISOString() + '</time>' +
            '</metadata>' +
            '<trk>' +
            '<type>running</type>' +
            '<name>' + activityName + '</name>' +
            '<trkseg>';
        
        let body = '';
        let currentTime = dayjs(startTime);
        let prevPoint = null;
        
        // Sort points by routeIndex to ensure we process one route at a time
        points.sort((a, b) => {
            if (a.routeIndex !== b.routeIndex) {
                return a.routeIndex - b.routeIndex;
            }
            // If same route, maintain original order
            return points.indexOf(a) - points.indexOf(b);
        });
        
        // Simple sequential processing of all points
        points.forEach((point, index) => {
            // Calculate time if not the first point of a route
            if (index > 0) {
                // If moving to a new route, add a small time gap
                if (prevPoint && point.routeIndex !== prevPoint.routeIndex) {
                    // Add a 1-second gap between routes
                    currentTime = currentTime.add(1, 'second');
                } else if (prevPoint) {
                    const prevLatLng = L.latLng(prevPoint.lat, prevPoint.lng);
                    const currentLatLng = L.latLng(point.lat, point.lng);
                    const distance = prevLatLng.distanceTo(currentLatLng); // in meters
                    
                    // Calculate time to travel this segment (in milliseconds)
                    const timeMs = (distance / speedMetersSec) * 1000;
                    currentTime = currentTime.add(timeMs, 'millisecond');
                }
            }
            
            // Add small random variation to elevation if desired
            const pointElevation = elevation + (Math.random() * 2 - 1);
            
            body += '<trkpt lat="' + point.lat + '" lon="' + point.lng + '">' +
                '<ele>' + pointElevation.toFixed(1) + '</ele>' +
                '<time>' + currentTime.toISOString() + '</time>' +
                '</trkpt>';
            
            prevPoint = point;
        });
        
        const footer = '</trkseg></trk></gpx>';
        
        return header + body + footer;
    }
    
    // Update total time when pace changes
    speedInput.addEventListener('change', updateRouteInfo);
    
    // Initialize button states
    updateButtonStates();
}); 