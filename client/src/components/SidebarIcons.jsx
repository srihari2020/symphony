import React from 'react';
import { motion } from 'framer-motion';

const iconVariants = {
    normal: { scale: 1, rotate: 0 },
    hover: { scale: 1.1, rotate: 5, transition: { type: 'spring', stiffness: 300 } },
    active: { scale: 1.1, stroke: '#fff', transition: { duration: 0.2 } }
};

const pathVariants = {
    normal: { pathLength: 1, opacity: 0.7 },
    hover: { pathLength: 1, opacity: 1 },
    active: { pathLength: 1, opacity: 1 }
};

export const DashboardIcon = ({ isActive }) => (
    <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={iconVariants}
        animate={isActive ? 'active' : 'normal'}
        whileHover="hover"
    >
        <motion.path
            d="M3 13H11V3H3V13ZM3 21H11V15H3V21ZM13 21H21V11H13V21ZM13 3V9H21V3H13Z"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <defs>
            <linearGradient id="icon-gradient-teal" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
        </defs>
    </motion.svg>
);

export const TeamIcon = ({ isActive }) => (
    <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={iconVariants}
        animate={isActive ? 'active' : 'normal'}
        whileHover="hover"
    >
        <motion.path
            d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <motion.path
            d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <motion.path
            d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <motion.path
            d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11684 19.0078 7.005C19.0078 7.89316 18.7122 8.75608 18.1676 9.45768C17.623 10.1593 16.8604 10.6597 16 10.88"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
    </motion.svg>
);

export const SettingsIcon = ({ isActive }) => (
    <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={iconVariants}
        animate={isActive ? 'active' : 'normal'}
        whileHover={{ rotate: 90, transition: { type: 'spring' } }}
    >
        <motion.path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <motion.path
            d="M19.4 15C19.4 15 20.76 15.65 21.68 15.1C22.6 14.55 22.5 12.8 22.5 12.8C22.5 12.8 22.5 11 22.5 11C22.5 11 22.6 9.3 21.68 8.8C20.76 8.3 19.4 9 19.4 9C19.4 9 18.2 8.3 18 8C17.8 7.7 18 6.4 18 6.4C18 6.4 17.7 4.7 16.7 4.2C15.7 3.7 14.6 4.7 14.6 4.7C14.6 4.7 14 4.1 13 4C12 3.9 12 2 12 2C12 2 10.2 2 10.2 2C10.2 2 9 3.9 8 4C7 4.1 6.4 4.7 6.4 4.7C6.4 4.7 5.3 3.7 4.3 4.2C3.3 4.7 3 6.4 3 6.4C3 6.4 3.2 7.7 3 8C2.8 8.3 1.6 9 1.6 9C1.6 9 0.299988 8.3 0.299988 11C0.299988 13.7 1.6 15 1.6 15C1.6 15 2.8 15.7 3 16C3.2 16.3 3 17.6 3 17.6C3 17.6 3.3 19.3 4.3 19.8C5.3 20.3 6.4 19.3 6.4 19.3C6.4 19.3 7 19.9 8 20C9 20.1 10.2 22 10.2 22C10.2 22 12 22 12 22C12 22 12 20.1 13 20C14 19.9 14.6 19.3 14.6 19.3C14.6 19.3 15.7 20.3 16.7 19.8C17.7 19.3 18 17.6 18 17.6C18 17.6 17.8 16.3 18 16C18.2 15.7 19.4 15 19.4 15Z"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </motion.svg>
);
export const CommunityIcon = ({ isActive }) => (
    <motion.svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        variants={iconVariants}
        animate={isActive ? 'active' : 'normal'}
        whileHover={{ scale: 1.1, rotate: 10, transition: { type: 'spring' } }}
    >
        <motion.path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <motion.path
            d="M2.5 10H21.5"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <motion.path
            d="M2.5 14H21.5"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
        <motion.path
            d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"
            stroke={isActive ? "url(#icon-gradient-teal)" : "currentColor"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={pathVariants}
        />
    </motion.svg>
);
