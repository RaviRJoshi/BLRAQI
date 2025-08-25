const API_KEY = 'YOUR_API_KEY_HERE'; // Get from https://openweathermap.org/api

async function getAQIData(lat, lon, days = 10) {
    try {
        // Calculate timestamps for the last 10 days
        const endTime = Math.floor(Date.now() / 1000); // Current timestamp
        const startTime = endTime - (days * 24 * 60 * 60); // 10 days ago
        
        // Fetch historical air pollution data
        const response = await fetch(
            `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${startTime}&end=${endTime}&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process and format the data
        const processedData = data.list.map(item => {
            const date = new Date(item.dt * 1000);
            return {
                date: date.toISOString().split('T')[0], // YYYY-MM-DD format
                datetime: date.toISOString(),
                aqi: item.main.aqi, // Air Quality Index (1-5 scale)
                pollutants: {
                    co: item.components.co,      // Carbon monoxide (μg/m³)
                    no: item.components.no,      // Nitric oxide (μg/m³)
                    no2: item.components.no2,    // Nitrogen dioxide (μg/m³)
                    o3: item.components.o3,      // Ozone (μg/m³)
                    so2: item.components.so2,    // Sulphur dioxide (μg/m³)
                    pm2_5: item.components.pm2_5, // PM2.5 (μg/m³)
                    pm10: item.components.pm10,  // PM10 (μg/m³)
                    nh3: item.components.nh3     // Ammonia (μg/m³)
                }
            };
        });
        
        // Group by date and get daily averages
        const dailyAverages = {};
        processedData.forEach(item => {
            if (!dailyAverages[item.date]) {
                dailyAverages[item.date] = {
                    date: item.date,
                    aqi_values: [],
                    pollutants: {
                        co: [], no: [], no2: [], o3: [], 
                        so2: [], pm2_5: [], pm10: [], nh3: []
                    }
                };
            }
            
            dailyAverages[item.date].aqi_values.push(item.aqi);
            Object.keys(item.pollutants).forEach(pollutant => {
                dailyAverages[item.date].pollutants[pollutant].push(item.pollutants[pollutant]);
            });
        });
        
        // Calculate averages
        const finalData = Object.values(dailyAverages).map(day => {
            const avgAQI = Math.round(
                day.aqi_values.reduce((sum, val) => sum + val, 0) / day.aqi_values.length
            );
            
            const avgPollutants = {};
            Object.keys(day.pollutants).forEach(pollutant => {
                const values = day.pollutants[pollutant];
                avgPollutants[pollutant] = Math.round(
                    (values.reduce((sum, val) => sum + val, 0) / values.length) * 100
                ) / 100;
            });
            
            return {
                date: day.date,
                aqi: avgAQI,
                aqi_description: getAQIDescription(avgAQI),
                pollutants: avgPollutants
            };
        });
        
        return finalData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
    } catch (error) {
        console.error('Error fetching AQI data:', error);
        throw error;
    }
}

function getAQIDescription(aqi) {
    const descriptions = {
        1: 'Good',
        2: 'Fair', 
        3: 'Moderate',
        4: 'Poor',
        5: 'Very Poor'
    };
    return descriptions[aqi] || 'Unknown';
}

// Usage example:
async function example() {
    try {
        // Example: New York City coordinates
        const lat = 40.7128;
        const lon = -74.0060;
        
        console.log('Fetching AQI data for the last 10 days...');
        const aqiData = await getAQIData(lat, lon);
        
        console.log('AQI Data:');
        aqiData.forEach(day => {
            console.log(`${day.date}: AQI ${day.aqi} (${day.aqi_description})`);
            console.log(`  PM2.5: ${day.pollutants.pm2_5} μg/m³`);
            console.log(`  PM10: ${day.pollutants.pm10} μg/m³`);
            console.log(`  O3: ${day.pollutants.o3} μg/m³`);
            console.log('---');
        });
        
    } catch (error) {
        console.error('Failed to fetch AQI data:', error);
    }
}

// Uncomment to run the example
// example();