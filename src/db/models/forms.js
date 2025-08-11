import {DataTypes} from 'sequelize';
import {TABLE_NAMES} from '../../helper/constants.js';

export const formSchema = {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.users,
            key: 'id'
        }
    },
    idea_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: TABLE_NAMES.ideas,
            key: 'id'
        }
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    start_time: {
        type: DataTypes.DATE,
        // allowNull: true
    },
    end_time: {
        type: DataTypes.DATE,
        // allowNull: false
    },
    form_url: {
        type: DataTypes.TEXT,
        // allowNull: false
    }
}
