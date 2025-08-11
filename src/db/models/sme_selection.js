import { DataTypes } from 'sequelize';
import { TABLE_NAMES } from '../../helper/constants.js';

export const smeSelectionSchema = {
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
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        },
        onDelete: 'CASCADE'
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