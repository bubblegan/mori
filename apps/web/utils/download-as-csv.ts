export const downloadCsv = (data: object[], filename = "data.csv") => {
  // Create a CSV string from the data
  let csvContent = "data:text/csv;charset=utf-8,";
  // Add the headers from the first data object keys
  csvContent += Object.keys(data[0]).join(",") + "\r\n";
  // Add the data rows
  data.forEach((item) => {
    csvContent += Object.values(item).join(",") + "\r\n";
  });

  // Create a link to trigger the download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link); // Required for FF

  // Trigger the download
  link.click();
  document.body.removeChild(link);
};
