"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/primitives";
import { adminLabels } from "@/lib/admin/labels";
import { slugify } from "@/lib/utils";

import {
  createCategoryAction,
  deletePostAction,
  savePostAction,
  type PostFormState,
} from "./actions";
import { uploadImageAction } from "./upload-actions";

type Category = { id: string; nameFr: string; nameEn: string };

type Initial = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  language: "fr" | "en";
  categoryId: string;
  tags: string[];
  coverImageUrl: string;
  coverImageAlt: string;
  coverImageWidth?: number | null;
  coverImageHeight?: number | null;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  status: string;
};

export function PostEditor({
  initial,
  categories,
  uploadAvailable,
}: {
  initial: Initial;
  categories: Category[];
  uploadAvailable: boolean;
}) {
  const router = useRouter();
  const [state, setState] = React.useState<PostFormState>({ status: "idle" });
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState(initial.title);
  const [slug, setSlug] = React.useState(initial.slug);
  const [slugTouched, setSlugTouched] = React.useState(Boolean(initial.slug));
  const [excerpt, setExcerpt] = React.useState(initial.excerpt);
  const [content, setContent] = React.useState(initial.content);
  const [tags, setTags] = React.useState(initial.tags.join(", "));
  const [coverUrl, setCoverUrl] = React.useState(initial.coverImageUrl);
  const [coverAlt, setCoverAlt] = React.useState(initial.coverImageAlt);
  const [coverWidth, setCoverWidth] = React.useState<number | null>(
    initial.coverImageWidth ?? null,
  );
  const [coverHeight, setCoverHeight] = React.useState<number | null>(
    initial.coverImageHeight ?? null,
  );
  const [status, setStatus] = React.useState(initial.status);
  const [language, setLanguage] = React.useState(initial.language);
  const [categoryId, setCategoryId] = React.useState(initial.categoryId);
  const [imageDialogOpen, setImageDialogOpen] = React.useState(false);
  const [imageTarget, setImageTarget] = React.useState<"cover" | "inline">("cover");
  const [pendingUrl, setPendingUrl] = React.useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false);
  const [categoryBusy, setCategoryBusy] = React.useState(false);
  const [categoryError, setCategoryError] = React.useState<string | null>(null);
  const [knownCategories, setKnownCategories] = React.useState(categories);

  const formRef = React.useRef<HTMLFormElement>(null);
  const isNew = !initial.id;

  function collect(): FormData {
    const form = formDataFrom(formRef.current, {
      title,
      slug,
      excerpt,
      content,
      tags,
      coverImageUrl: coverUrl,
      coverImageAlt: coverAlt,
      coverImageWidth: coverWidth?.toString() ?? "",
      coverImageHeight: coverHeight?.toString() ?? "",
      status,
      language,
      categoryId,
    });
    return form;
  }

  async function save(nextStatus?: string) {
    setSaving(true);
    setState({ status: "idle" });

    const payload = collect();
    if (nextStatus) payload.set("status", nextStatus);
    if (nextStatus === "publie") payload.set("publishNow", "true");

    try {
      const result = await savePostAction(payload);
      setState(result);
      if (result.status === "saved") {
        router.refresh();
        if (isNew && result.postId) {
          router.replace(`/admin/blog/${result.postId}`);
        }
      }
    } catch {
      setState({ status: "error", message: adminLabels.common.error });
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(file: File) {
    setUploading(true);
    setUploadError(null);

    const payload = new FormData();
    payload.set("file", file);

    const result = await uploadImageAction(payload);

    setUploading(false);
    if (result.ok) {
      if (result.width) setCoverWidth(result.width);
      if (result.height) setCoverHeight(result.height);
      setImageDialogOpen(false);

      if (imageTarget === "cover") {
        setCoverUrl(result.url);
      } else {
        insertInlineImage(result.url);
      }
    } else {
      setUploadError(result.reason);
    }
  }

  /** Append a figure at the end of the article body. */
  function insertInlineImage(url: string) {
    const safe = url.replace(/"/g, "&quot;");
    setContent((current) => `${current}<figure><img src="${safe}" alt=""></figure><p><br></p>`);
  }

  function openImageDialog(target: "cover" | "inline") {
    setImageTarget(target);
    setUploadError(null);
    setImageDialogOpen(true);
  }

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form
      ref={formRef}
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"
    >
      <input type="hidden" name="id" value={initial.id ?? ""} />

      <div className="min-w-0 space-y-6">
        {state.message ? (
          <p
            role="status"
            className={
              state.status === "saved"
                ? "rounded-xl border border-success/35 bg-success/10 px-4 py-3 text-sm text-[#bcd9a8]"
                : "rounded-xl border border-danger/45 bg-danger/10 px-4 py-3 text-sm text-[#eba295]"
            }
          >
            {state.message}
          </p>
        ) : null}

        <Field
          id="post-title"
          label={adminLabels.blog.title}
          required
          error={fieldErrors.title}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugTouched) setSlug(slugify(event.target.value));
              }}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              className="text-lg"
            />
          )}
        </Field>

        <Field
          id="post-slug"
          label={adminLabels.blog.slug}
          hint={adminLabels.blog.slugHint}
          error={fieldErrors.slug}
        >
          {({ id, describedBy, invalid }) => (
            <div className="flex items-center gap-2">
              <Input
                id={id}
                value={slug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setSlug(event.target.value);
                }}
                aria-describedby={describedBy}
                aria-invalid={invalid}
                className="font-mono text-sm"
              />
              {slug ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Réinitialiser le slug"
                  onClick={() => {
                    setSlugTouched(false);
                    setSlug(slugify(title));
                  }}
                >
                  <X aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          )}
        </Field>

        <Field
          id="post-excerpt"
          label={adminLabels.blog.excerpt}
          hint={adminLabels.blog.excerptHint}
          error={fieldErrors.excerpt}
        >
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              rows={3}
              aria-describedby={describedBy}
            />
          )}
        </Field>

        <div className="space-y-2">
          <span className="text-sm font-medium leading-none text-gold-200">
            {adminLabels.blog.content}
          </span>
          <RichTextEditor
            id="post-content"
            label={adminLabels.blog.content}
            value={content}
            onChange={setContent}
            onImageRequest={() => openImageDialog("inline")}
            invalid={Boolean(fieldErrors.content)}
          />
          {fieldErrors.content ? (
            <p role="alert" className="text-xs font-medium text-danger">
              {fieldErrors.content}
            </p>
          ) : null}
        </div>

        {/* --- SEO --- */}
        <fieldset className="surface-card space-y-5 rounded-2xl p-6">
          <legend className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
            {adminLabels.blog.seoTitle}
          </legend>

          <Field id="post-seoTitle" label={adminLabels.settings.seoTitle}>
            {({ id }) => (
              <Input
                id={id}
                name="seoTitle"
                defaultValue={initial.seoTitle}
                maxLength={80}
              />
            )}
          </Field>

          <Field
            id="post-seoDescription"
            label={adminLabels.settings.seoDescription}
            hint={adminLabels.settings.seoDescriptionHint}
          >
            {({ id }) => (
              <Textarea
                id={id}
                name="seoDescription"
                defaultValue={initial.seoDescription}
                maxLength={200}
                rows={2}
              />
            )}
          </Field>
        </fieldset>
      </div>

      {/* --- Sidebar --- */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <section className="surface-card space-y-5 rounded-2xl p-6">
          <Field id="post-status" label={adminLabels.blog.status}>
            {({ id }) => (
              <Select
                id={id}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="brouillon">{adminLabels.blog.statuses.brouillon}</option>
                <option value="publie">{adminLabels.blog.statuses.publie}</option>
                <option value="archive">{adminLabels.blog.statuses.archive}</option>
              </Select>
            )}
          </Field>

          <Field id="post-language" label={adminLabels.blog.language}>
            {({ id }) => (
              <Select
                id={id}
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as "fr" | "en")
                }
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </Select>
            )}
          </Field>

          <Field id="post-category" label={adminLabels.blog.category}>
            {({ id }) => (
              <div className="flex items-center gap-2">
                <Select
                  id={id}
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                >
                  <option value="">{adminLabels.blog.noCategory}</option>
                  {knownCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {language === "fr" ? category.nameFr : category.nameEn}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  variant="surface"
                  size="icon-sm"
                  aria-label={adminLabels.blog.newCategory}
                  title={adminLabels.blog.newCategory}
                  onClick={() => {
                    setCategoryError(null);
                    setCategoryDialogOpen(true);
                  }}
                >
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            )}
          </Field>

          <Field id="post-author" label={adminLabels.blog.author}>
            {({ id }) => (
              <Input
                id={id}
                name="authorName"
                defaultValue={initial.authorName}
              />
            )}
          </Field>

          <div className="space-y-3 pt-2">
            <Button type="submit" block disabled={saving}>
              {saving ? (
                <Spinner />
              ) : (
                <Save aria-hidden="true" />
              )}
              {saving ? adminLabels.blog.saving : adminLabels.blog.save}
            </Button>

            <Button
              type="button"
              variant="primary"
              block
              disabled={saving}
              onClick={() => void save("publie")}
            >
              <Send aria-hidden="true" />
              {status === "publie"
                ? adminLabels.blog.publish
                : adminLabels.blog.publish}
            </Button>

            {status === "publie" ? (
              <Button
                type="button"
                variant="outline"
                block
                disabled={saving}
                onClick={() => void save("brouillon")}
              >
                {adminLabels.blog.unpublish}
              </Button>
            ) : null}

            {initial.id ? (
              <Button asChild variant="surface" block>
                <Link
                  href={`/admin/blog/${initial.id}/apercu`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye aria-hidden="true" />
                  {adminLabels.blog.preview}
                </Link>
              </Button>
            ) : null}
          </div>
        </section>

        {/* --- Cover image --- */}
        <section className="surface-card space-y-4 rounded-2xl p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-500">
            {adminLabels.blog.coverImage}
          </h2>

          {coverUrl ? (
            <div className="space-y-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt=""
                className="aspect-video w-full rounded-lg border border-line object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCoverUrl("")}
              >
                <X aria-hidden="true" />
                {adminLabels.blog.removeImage}
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openImageDialog("cover")}
              className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line-strong text-content-subtle transition-colors hover:border-gold-600 hover:text-gold-300"
            >
              <ImageIcon aria-hidden="true" className="size-6" />
              <span className="text-xs">{adminLabels.blog.uploadImage}</span>
            </button>
          )}

          <Field id="post-coverUrl" label="URL de l'image">
            {({ id }) => (
              <Input
                id={id}
                name="coverImageUrl"
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
                placeholder="https://…"
              />
            )}
          </Field>

          <Field
            id="post-coverAlt"
            label={adminLabels.blog.coverImageAlt}
            hint={adminLabels.blog.coverImageAltHint}
          >
            {({ id }) => (
              <Input
                id={id}
                name="coverImageAlt"
                value={coverAlt}
                onChange={(event) => setCoverAlt(event.target.value)}
              />
            )}
          </Field>
        </section>

        <section className="surface-card space-y-4 rounded-2xl p-6">
          <Field id="post-tags" label={adminLabels.blog.tags} hint={adminLabels.blog.tagsHint}>
            {({ id }) => (
              <Input
                id={id}
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="gare, tgv,-transfert"
              />
            )}
          </Field>
          <input type="hidden" name="tags" value={tags} />
        </section>

        {initial.id ? (
          <DeleteButton postId={initial.id} />
        ) : null}
      </aside>

      {/* --- Image dialog --- */}
      {imageDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={adminLabels.blog.uploadImage}
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 p-5 backdrop-blur-sm"
        >
          <div className="surface-panel w-full max-w-md rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg">{adminLabels.blog.uploadImage}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setImageDialogOpen(false)}
                aria-label={adminLabels.common.close}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {!uploadAvailable ? (
              <p className="mt-4 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-[#e8bf80]">
                {adminLabels.blog.uploadFailed}
              </p>
            ) : null}

            <label className="mt-5 flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center transition-colors hover:border-gold-600">
              {uploading ? (
                <Loader2 aria-hidden="true" className="size-6 animate-spin" />
              ) : (
                <Upload aria-hidden="true" className="size-6 text-gold-500" />
              )}
              <span className="text-sm text-content-muted">
                {uploading
                  ? adminLabels.blog.uploading
                  : "Choisir un fichier"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading || !uploadAvailable}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void onUpload(file);
                }}
              />
            </label>

            {uploadError ? (
              <p role="alert" className="mt-4 text-xs text-danger">
                {uploadError}
              </p>
            ) : null}

            <div className="mt-6 border-t border-line pt-5">
              <p className="text-xs text-content-subtle">
                Ou collez l&apos;adresse d&apos;une image :
              </p>
              <div className="mt-3 flex gap-2">
                <Input
                  value={pendingUrl}
                  onChange={(event) => setPendingUrl(event.target.value)}
                  placeholder="https://…"
                />
                <Button
                  type="button"
                  variant="surface"
                  onClick={() => {
                    if (!pendingUrl.trim()) return;
                    if (imageTarget === "cover") setCoverUrl(pendingUrl.trim());
                    else insertInlineImage(pendingUrl.trim());
                    setImageDialogOpen(false);
                  }}
                >
                  {adminLabels.common.confirm}
                </Button>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-content-subtle">
              L&apos;image téléchargée est utilisée comme image de couverture.
              Pour insérer une image directement dans le texte, utilisez
              l&apos;icône image de la barre d&apos;outils de l&apos;éditeur, puis
              collez son adresse dans le champ ci-dessus.
            </p>
          </div>
        </div>
      ) : null}
    {/* --- New category dialog --- */}
      {categoryDialogOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={adminLabels.blog.newCategory}
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/90 p-5 backdrop-blur-sm"
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const data = new FormData(form);
              setCategoryBusy(true);
              setCategoryError(null);

              const result = await createCategoryAction(
                String(data.get("nameFr") ?? ""),
                String(data.get("nameEn") ?? ""),
              );

              setCategoryBusy(false);
              if (!result.ok || !result.id) {
                setCategoryError(result.message ?? adminLabels.common.error);
                return;
              }

              const nameFr = String(data.get("nameFr") ?? "");
              const nameEn = String(data.get("nameEn") ?? "");
              setKnownCategories((current) => [
                ...current,
                { id: result.id!, nameFr, nameEn: nameEn || nameFr },
              ]);
              setCategoryId(result.id);
              setCategoryDialogOpen(false);
              router.refresh();
            }}
            className="surface-panel w-full max-w-sm rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg">{adminLabels.blog.newCategory}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={adminLabels.common.close}
                onClick={() => setCategoryDialogOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>

            {categoryError ? (
              <p role="alert" className="mt-4 text-xs text-danger">
                {categoryError}
              </p>
            ) : null}

            <div className="mt-5 space-y-4">
              <Field id="cat-nameFr" label="Nom (français)" required>
                {({ id }) => <Input id={id} name="nameFr" required autoFocus />}
              </Field>
              <Field
                id="cat-nameEn"
                label="Name (English)"
                optionalLabel={adminLabels.common.optional}
              >
                {({ id }) => <Input id={id} name="nameEn" />}
              </Field>
            </div>

            <Button
              type="submit"
              className="mt-6"
              block
              disabled={categoryBusy}
            >
              {categoryBusy ? <Spinner /> : <Plus aria-hidden="true" />}
              {adminLabels.common.confirm}
            </Button>
          </form>
        </div>
      ) : null}
    </form>
  );
}

function DeleteButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  return (
    <Button
      type="button"
      variant="danger"
      block
      disabled={pending}
      onClick={async () => {
        if (!window.confirm(adminLabels.blog.deleteConfirm)) return;
        setPending(true);
        await deletePostAction(postId);
        router.push("/admin/blog");
        router.refresh();
      }}
    >
      <Trash2 aria-hidden="true" />
      {adminLabels.blog.delete}
    </Button>
  );
}

/**
 * Builds FormData from the form element plus live controlled state, so every
 * value reaches the Server Action without duplicating hidden inputs.
 */
function formDataFrom(
  form: HTMLFormElement | null,
  controlled: Record<string, string>,
): FormData {
  const payload = new FormData(form ?? undefined);
  for (const [key, value] of Object.entries(controlled)) {
    payload.set(key, value);
  }
  return payload;
}