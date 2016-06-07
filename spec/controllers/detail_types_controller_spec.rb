require 'rails_helper'

RSpec.describe DetailTypesController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  #describe "#index" do
  #  let(:detail_type) { 10.times{ create(:detail_type)} }
  #  subject { get :index }

  #  it "contains necessary keys" do
  #    expect(response.body).to eq(detail_type)
  #  end
  #end

  describe "#new" do
    subject { get :new }

    it "render new page" do
      expect(subject).to render_template(:new)
    end
  end

  describe "#create" do
    context "when detail_type was created" do
      let(:detail_type) { attributes_for(:detail_type) }
      subject { post :create, detail_type: detail_type }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when detail_type was not created" do
      let(:invalid_detail_type) { attributes_for(:invalid_detail_type) }
      subject { post :create, detail_type: invalid_detail_type }

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end

  describe "#update" do
    let(:detail_type_old) { create(:detail_type) }

    context "when detail_type was updated" do
      let(:detail_type_new) { attributes_for(:detail_type) }
      subject { put :update, name: detail_type_old.name, detail_type: detail_type_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when detail_type was not updated" do
      let(:invalid_detail_type) { attributes_for(:invalid_detail_type) }
      subject { put :update, name: detail_type_old.name, detail_type: invalid_detail_type }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  describe "#destroy" do
    context "when detail_type was destroyed" do
      let(:detail_type) { create(:detail_type) }
      subject { delete :destroy, id: detail_type.id }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
