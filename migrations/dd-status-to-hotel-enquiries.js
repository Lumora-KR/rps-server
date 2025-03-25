module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("HotelEnquiries", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("HotelEnquiries", "status");
  },
};
