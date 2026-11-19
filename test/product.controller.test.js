import assert from "node:assert/strict";
import https from "node:https";
import { Readable, Writable } from "node:stream";
import test from "node:test";
import { v2 as cloudinary } from "cloudinary";
import Product from "../src/models/product.model.js";
import { createProduct } from "../src/controllers/product.controller.js";

function response() {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    }
  };
}

function request(file) {
  return {
    body: { name: "Producto", description: "Descripción", price: 10 },
    file
  };
}

test("crear producto espera la subida del buffer y guarda la URL", { timeout: 2000 }, async (t) => {
  const buffer = Buffer.from("imagen");
  let uploaded;
  t.mock.method(cloudinary.uploader, "upload_stream", (options, callback) => new Writable({
    write(chunk, encoding, done) {
      uploaded = chunk;
      done();
    },
    final(done) {
      setImmediate(() => {
        callback(null, { secure_url: "https://example.com/image.jpg" });
        done();
      });
    }
  }));
  const save = t.mock.method(Product.prototype, "save", async function () {
    return this;
  });
  const res = response();

  await createProduct(request({ buffer }), res);

  assert.deepEqual(uploaded, buffer);
  assert.equal(save.mock.calls.length, 1);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.product.image, "https://example.com/image.jpg");
});

test("un error de Cloudinary impide guardar el producto", { timeout: 2000 }, async (t) => {
  t.mock.method(cloudinary.uploader, "upload_stream", (options, callback) => new Writable({
    write(chunk, encoding, done) {
      done();
    },
    final(done) {
      setImmediate(() => {
        callback(new Error("Error de Cloudinary"));
        done();
      });
    }
  }));
  const save = t.mock.method(Product.prototype, "save", async function () {
    return this;
  });
  const res = response();

  await createProduct(request({ buffer: Buffer.from("imagen") }), res);

  assert.equal(save.mock.calls.length, 0);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
});

test("el SDK de Cloudinary maneja una respuesta 401 sin rechazos no controlados", { timeout: 2000 }, async (t) => {
  for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_KEY", "CLOUDINARY_SECRET"]) {
    const previous = process.env[key];
    t.after(() => {
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    });
    process.env[key] = "test";
  }
  t.mock.method(https, "request", (options, callback) => {
    const outgoing = new Writable({
      write(chunk, encoding, done) {
        done();
      },
      final(done) {
        const incoming = Readable.from([JSON.stringify({ error: { message: "Invalid Signature" } })]);
        incoming.statusCode = 401;
        callback(incoming);
        done();
      }
    });
    outgoing.setTimeout = () => outgoing;
    return outgoing;
  });
  const save = t.mock.method(Product.prototype, "save", async function () {
    return this;
  });
  const res = response();

  await createProduct(request({ buffer: Buffer.from("imagen") }), res);

  assert.equal(save.mock.calls.length, 0);
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.success, false);
});

test("crear producto sin imagen no llama a Cloudinary", async (t) => {
  const upload = t.mock.method(cloudinary.uploader, "upload_stream");
  const save = t.mock.method(Product.prototype, "save", async function () {
    return this;
  });
  const res = response();

  await createProduct(request(), res);

  assert.equal(upload.mock.calls.length, 0);
  assert.equal(save.mock.calls.length, 1);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.product.image, undefined);
});
