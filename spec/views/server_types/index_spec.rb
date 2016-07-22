require 'rails_helper'

RSpec.describe "server_parts/index", type: :feature, js: true do

  let(:admin_user) { create(:admin_user) }
  let!(:server_types) { create_list(:server_type, 5) }
  let!(:server_type) { ServerType.first }
  before do
    login_as admin_user
    visit server_types_path
  end

  it "renders link to delete the record" do
    expect(page).to have_selector("a[href='#{server_type_path(server_type.id)}']")
  end

  it "renders \"add\" form to redirect to the create page" do
    expect(page).to have_selector("form[action='#{new_server_type_path}']")
  end

  context "when click on a server_part row" do
    before { page.first("#servTypeTable tbody tr").click }

    it "shows modal window" do
      expect(page).to have_selector(".modal-content")
    end

    it "renders edit icon" do
      expect(page).to have_selector("a[href='/server_types/#{server_type.name}/edit']")
    end

    it "renders close button" do
      expect(page).to have_selector("button[data-id='closeModal']")
      # expect(page).to have_button("Закрыть")
    end

    it "sets type name in modal head" do
      expect(page.find('h4.modal-title').text).to eq server_type.name
    end

    context "shows structure of server_type in modal body" do
      let(:current_names) { page.find("#modal .modal-body").all("tr:not(:first-child)").map{ |td| td.find("td:first-child").text } }
      let(:expected_names) { server_type.server_parts.map(&:name) }

      it "shows server_part names" do
        expect(current_names).to eq expected_names
      end

      let(:current_counts) { page.find("#modal .modal-body").all("tr:not(:first-child)").map{ |td| td.find("td:nth-child(2)").text.to_i } }
      let(:expected_counts) { server_type.template_server_details.map(&:count) }

      it "shows server_part counts" do
        expect(current_counts).to eq expected_counts
      end
    end

    context "when click on the close button" do
      subject { click_button "Закрыть" }
      before do
        subject
        sleep 1
      end

      it "hides the modal frame" do
        expect(page.has_no_selector?("#modal")).to be_truthy
      end

      let(:row_count) { page.find("#modal .modal-body table[data-id='details']", visible: false).all("tr", visible: false).size }

      it "delete all created rows from the modal frame" do
        expect(row_count).to eq 1
      end
    end
  end

end
