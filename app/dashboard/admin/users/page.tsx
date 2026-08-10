"use client";

import { useEffect, useState } from "react";

type UserRow = {
  _id: string;
  name: string;
  email: string;
  role: "student" | "company" | "admin";
  createdAt: string;
};

const roleStyles: Record<string, string> = {
  student: "bg-primary/10 text-primary",
  company: "bg-accent/10 text-accent",
  admin: "bg-primary-2/10 text-primary-2",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((data) => setUsers(data.users || []))
      .catch(() => setError("Failed to load users"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-text">
            Users
          </h1>
          <p className="mt-1 text-text-muted">
            {loading ? "Loading..." : `${filtered.length} user${filtered.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
        >
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="company">Companies</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        {loading ? (
          <div className="h-64 animate-pulse" />
        ) : error ? (
          <p className="p-6 text-sm text-primary-2">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-12 text-center text-text">No users found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-text-muted">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text">{u.name}</td>
                  <td className="px-5 py-3 text-text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        roleStyles[u.role] || "bg-text-muted/10 text-text-muted"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {new Date(u.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
