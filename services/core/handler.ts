export const getYear = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify({ year: 2025 })
  };
};
