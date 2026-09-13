/**
 * WeatherAlertBanner: Displays real-time monsoon warning banner and trigger button for 3-way contingency sheet.
 */

export function renderWeatherAlertBanner(block, isWeatherAlertActive) {
  const isPenangHill =
    block.id === 'd1-penang-hill' ||
    block.id === 'penang-hill-canopy' ||
    (block.title && block.title.includes('Penang Hill')) ||
    (block.id === 'd1-2' && block.title && block.title.includes('Penang'));

  if (!isWeatherAlertActive || !isPenangHill || block.status === 'cancelled') {
    return '';
  }

  return `
    <div class="weather-alert-banner">
      <div class="weather-alert-banner__content">
        <span style="font-size: 15px;">🌧️</span>
        <div>
          <strong>Weather Alert:</strong> Heavy Monsoon Downpour at Penang Hill Outdoor Station
        </div>
      </div>
      <button type="button" class="btn-resolve-contingency" data-resolve-contingency="${block.id}">
        Resolve Contingency ▾
      </button>
    </div>
  `;
}
