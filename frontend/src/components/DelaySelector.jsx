import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";

const delayOptions = [
    { label: "Realtime", value: 5 },
    { label: "Low", value: 10 },
    { label: "Medium", value: 20 },
    { label: "High", value: 30 },
    { label: "Epic", value: 45 }
];

export default function DelaySelector({ onChange }) {
    const stored = parseInt(localStorage.getItem("streamDelay"), 10);
    const defaultDelay = delayOptions.find(opt => opt.value === stored) ? stored : 20;
    const [selected, setSelected] = useState(defaultDelay);

    useEffect(() => {
        onChange(selected);
    }, []);

    const handleSelect = (valueStr) => {
        const value = parseInt(valueStr, 10);
        setSelected(value);
        localStorage.setItem("streamDelay", value.toString());
        onChange(value);
    };

    const selectedLabel = delayOptions.find(opt => opt.value === selected)?.label || `${selected} ms`;

    return (
        <Dropdown className="mb-3">
            <Dropdown.Toggle
                variant="secondary"
                size="sm"
                id="dropdown-delay-selector"
            >
                Delay: {selectedLabel}
            </Dropdown.Toggle>

            <Dropdown.Menu className="bg-dark text-light">
                {delayOptions.map((opt) => (
                    <Dropdown.Item
                        key={opt.value}
                        eventKey={opt.value}
                        onClick={() => handleSelect(opt.value)}
                        className="dropdown-item-dark"
                    >
                        {opt.label}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}
