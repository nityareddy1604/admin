import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../../helper/constants.js';

export const lensSelectionSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    idea_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.ideas,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    lens_type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}; 