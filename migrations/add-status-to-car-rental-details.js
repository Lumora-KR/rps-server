module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("car_rental_details", "status", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "pending",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("car_rental_details", "status");
  },
};
