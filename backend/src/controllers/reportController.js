export const createReport = (req, res) => {
  res.status(202).json({
    data: null,
    message: 'Crowd report service is ready for persistence integration.',
    received: req.body || {},
  });
};
