require 'rails_helper'

RSpec.describe ServerPartsController, type: :controller do

  let(:admin_user) { create(:admin_user) }
  before { sign_in :user, admin_user }

  describe "#check_for_cancel" do
    subject { get :index, cancel: true }

    it "redirects to cancel path" do
      expect(subject).to redirect_to server_parts_path
    end
  end

  describe "#index" do
    let(:server_part) { create(:server_part) }

    context "when sends html request" do
      subject { get :index }
      it "render index page" do
        expect(subject).to render_template :index
      end
    end

    context "when sends json request" do
      let(:expected_server_parts) do
        server_parts = ServerPart.select(:id, :name, :part_num, :detail_type_id)
        data = server_parts.as_json(include: { detail_type: { only: :name } }).each do |s|
          s['DT_RowId'] = s['id']
          s['del']      = "<a href='#{server_part_path(s['id'])}' class='text-danger' data-method='delete' rel='nofollow' title='Удалить' data-confirm='Вы действительно хотите удалить \"#{s['name']}\"?'><i class='fa fa-trash-o fa-1g'></a>"
          s.delete('id')
          s.delete('detail_type_id')
        end
      end
      subject { get :index, format: :json }

      it "sends server_parts data" do
        parser = JSON.parse(subject.body)
        expect(parser["data"]).to eq expected_server_parts.as_json
      end
    end
  end

  describe "#show"do
    context "when sends json request" do
      let(:server_part) { create(:server_part) }
      let(:expected_server_part) do
        expect_server_part = ServerPart.find(server_part.id)
        expect_server_part.as_json(include:  {
          detail_type: { only: :name }
        },
        except: [:id, :created_at, :updated_at, :detail_type_id])
      end
      subject { get :show, format: :json, id: server_part.id }

      it "sends the server_part data" do
        parser = JSON.parse(subject.body)
        expect(parser).to eq expected_server_part
      end
    end
  end

  describe "#new" do
    subject { get :new }

    it "renders new page" do
      expect(subject).to render_template(:new)
    end
  end

  describe "#create" do
    context "when server_part was created" do
      let(:server_part) { attributes_for(:server_part) }
      subject { post :create, server_part: server_part }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when detail_type was not created" do
      let(:invalid_server_part) { attributes_for(:invalid_server_part) }
      subject { post :create, server_part: invalid_server_part }

      it "renders new page" do
        expect(subject).to render_template :new
      end
    end
  end

  describe "#update" do
    let(:server_part_old) { create(:server_part) }

    context "when server_part was updated" do
      let(:server_part_new) { attributes_for(:server_part) }
      subject { put :update, name: server_part_old.name, server_part: server_part_new }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end

    context "when server_part was not updated" do
      let(:invalid_server_part) { attributes_for(:invalid_server_part) }
      subject { put :update, name: server_part_old.name, server_part: invalid_server_part }

      it "renders edit page" do
        expect(subject).to render_template :edit
      end
    end
  end

  describe "#destroy" do
    context "when server_part was(or not) destroyed" do
      let(:server_part) { create(:server_part) }
      subject { delete :destroy, id: server_part.id }

      it "redirects to index action" do
        expect(subject).to redirect_to action: :index
      end
    end
  end

end
