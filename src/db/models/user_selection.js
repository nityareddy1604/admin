import { DataTypes } from 'sequelize';
import { TABLE_NAMES, USER_ROLES } from '../../helper/constants.js';

export const userSelectionSchema = {
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
    user_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [Object.values(USER_ROLES)]
        }
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