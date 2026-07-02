import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { cardsApi } from "../api/cards";
import { studentsApi } from "../api/students";
import { useToast } from "../context/ToastContext";
import { useAsync } from "../hooks/useAsync";
import type { Gender, Student, StudentRequestDto } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Textarea } from "../components/ui/Textarea";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/States";

const emptyForm: StudentRequestDto = {
  name: "",
  email: "",
  mobile: "",
  department: "",
  semester: "",
  gender: "MALE",
  address: "",
  dob: "",
  cardId: 0,
};

export function StudentsPage() {
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<StudentRequestDto>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const { data: unassignedCards } = useAsync(() => cardsApi.getUnused());
  const { data, loading, error, reload } = useAsync(
    () => studentsApi.getAll({ pageNo: page, pageSize, sortBy, sortOrder }),
    [page, pageSize, sortBy, sortOrder],
  );

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setForm({
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      department: student.department,
      semester: student.semester,
      gender: student.gender,
      address: student.address,
      dob: student.dob,
      cardId: student.card?.id ?? 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (editing) {
        await studentsApi.update(editing.id, form);
        showSuccess("Student updated successfully");
      } else {
        await studentsApi.create(form);
        showSuccess("Student created successfully");
      }
      closeModal();
      await reload();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to save student");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (student: Student) => {
    if (!window.confirm(`Delete student "${student.name}"?`)) return;

    try {
      await studentsApi.remove(student.id);
      showSuccess("Student deleted successfully");
      await reload();
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Failed to delete student",
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Students"
        description="Register students and link them to library cards."
        action={
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add Student
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select
          label=""
          aria-label="Sort by"
          value={sortBy}
          onChange={(event) => {
            setSortBy(event.target.value);
            setPage(0);
          }}
          options={[
            { value: "id", label: "Sort: ID" },
            { value: "name", label: "Sort: Name" },
            { value: "email", label: "Sort: Email" },
            { value: "department", label: "Sort: Department" },
          ]}
          className="w-44"
        />
        <Select
          label=""
          aria-label="Sort order"
          value={sortOrder}
          onChange={(event) => {
            setSortOrder(event.target.value as "asc" | "desc");
            setPage(0);
          }}
          options={[
            { value: "asc", label: "Ascending" },
            { value: "desc", label: "Descending" },
          ]}
          className="w-36"
        />
      </div>

      {loading ? <LoadingState /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!loading && !error && data?.content.length === 0 ? (
        <EmptyState
          title="No students yet"
          description="Create a library card first, then register a student."
          action={<Button onClick={openCreate}>Add Student</Button>}
        />
      ) : null}

      {!loading && !error && data && data.content.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-surface-muted text-text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Card</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((student) => (
                    <tr key={student.id} className="border-t border-border/70">
                      <td className="px-4 py-3">
                        <p className="font-medium text-text">{student.name}</p>
                        <p className="text-xs text-text-muted">
                          {student.semester} · {student.gender}
                        </p>
                      </td>
                      <td className="px-4 py-3">{student.email}</td>
                      <td className="px-4 py-3">{student.department}</td>
                      <td className="px-4 py-3">
                        {student.card ? (
                          <Badge
                            tone={
                              student.card.cardStatus === "ACTIVE"
                                ? "success"
                                : "warning"
                            }
                          >
                            Card #{student.card.id}
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Unassigned</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(student)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(student)}
                          >
                            <Trash2 className="size-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-text-muted">
              Page {data.number + 1} of {Math.max(data.totalPages, 1)} ·{" "}
              {data.totalElements} students
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={data.first}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={data.last}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <Modal
        open={modalOpen}
        title={editing ? "Edit Student" : "Add Student"}
        onClose={closeModal}
        wide
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" form="student-form" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editing
                  ? "Update Student"
                  : "Create Student"}
            </Button>
          </>
        }
      >
        <form
          id="student-form"
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-2"
        >
          <Input
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Mobile"
            required
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
          <Input
            label="Date of Birth"
            required
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
          />
          <Input
            label="Department"
            required
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
          <Input
            label="Semester"
            required
            value={form.semester}
            onChange={(e) => setForm({ ...form, semester: e.target.value })}
          />
          <Select
            label="Gender"
            value={form.gender}
            onChange={(e) =>
              setForm({ ...form, gender: e.target.value as Gender })
            }
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
          />
          <Select
            label="Library Card"
            required
            value={String(form.cardId || "")}
            onChange={(e) =>
              setForm({ ...form, cardId: Number(e.target.value) })
            }
            options={[
              { value: "", label: "Select a card" },
              ...(unassignedCards ||  []).map((card) => ({
                value: String(card.id),
                label: `Card #${card.id} (${card.cardStatus})`,
              })),
            ]}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Address"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
