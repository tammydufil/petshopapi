"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Shifts", "starttime", {
      type: Sequelize.STRING,
      allowNull: true, // or false depending on your requirements
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Shifts", "starttime", {
      type: Sequelize.DATE,
      allowNull: true, // or false depending on your requirements
    });
  },
};
