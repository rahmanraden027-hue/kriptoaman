export async function onRequestGet() {
  return Response.json({
    success: true,
    service: "KriptoAman Auth",
    status: "online"
  });
}
